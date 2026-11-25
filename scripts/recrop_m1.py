#!/usr/bin/env python3
"""Recorta cada pregunta M1 desde el PDF oficial, sin la siguiente ni el encabezado."""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import fitz
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PDF_DIR = ROOT / "pruebas" / "oficiales"
OUT_DIR = ROOT / "data" / "m1_recrop"

FOLDER_TO_PDF = {
    "m1/2021_1": "M1-2021-1.pdf",
    "m1/2022_1": "M1-2022-1.pdf",
    "m1/2023_1": "M1-2023-1.pdf",
    "m1/2024_1": "M1-2024-1.pdf",
    "m1/2024_invierno": "M1-2024-invierno.pdf",
    "m1/2025_1": "M1-2025-1.pdf",
    "m1/2025_invierno": "M1-2025-invierno.pdf",
}

QUESTION_RE = re.compile(r"^(\d{1,2})\.\s+\S")
FOOTER_RE = re.compile(r"^-\s*\d+\s*-$")
DPI = 200
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://bmsmmlymsjpydpealmcw.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or ""


@dataclass(frozen=True)
class QuestionStart:
    number: int
    page: int
    y0: float
    y1: float


@dataclass(frozen=True)
class Clip:
    page: int
    y0: float
    y1: float


def _line_text(line: dict) -> str:
    return "".join(span["text"] for span in line.get("spans", [])).strip()


def header_bottom(page: fitz.Page) -> float:
    hits = page.search_for("FORMA")
    if hits:
        return max(hit.y1 for hit in hits) + 6
    return 52.0


def footer_top(page: fitz.Page) -> float:
    d = page.get_text("dict")
    for block in d.get("blocks", []):
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            text = _line_text(line)
            if FOOTER_RE.match(text):
                return line["bbox"][1] - 8
    return page.rect.y1 - 55


def find_starts(page: fitz.Page) -> list[QuestionStart]:
    starts: list[QuestionStart] = []
    d = page.get_text("dict")
    for block in d.get("blocks", []):
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            text = _line_text(line)
            match = QUESTION_RE.match(text)
            if not match:
                continue
            number = int(match.group(1))
            if not 1 <= number <= 65:
                continue
            x0, y0, _, y1 = line["bbox"]
            if x0 > 110:
                continue
            starts.append(QuestionStart(number, page.number, y0, y1))
    return starts


def index_questions(doc: fitz.Document) -> dict[int, list[Clip]]:
    starts: list[QuestionStart] = []
    for page in doc:
        starts.extend(find_starts(page))
    starts.sort(key=lambda item: (item.page, item.y0))

    unique: list[QuestionStart] = []
    seen: set[int] = set()
    for start in starts:
        if start.number in seen:
            continue
        seen.add(start.number)
        unique.append(start)

    bands: dict[int, list[Clip]] = {}
    for i, start in enumerate(unique):
        nxt = unique[i + 1] if i + 1 < len(unique) else None
        bands[start.number] = _clips_for(doc, start, nxt)
    return bands


def _clips_for(
    doc: fitz.Document, start: QuestionStart, nxt: QuestionStart | None
) -> list[Clip]:
    page = doc[start.page]
    y0 = max(start.y0 - 4, header_bottom(page))
    if nxt is None:
        return [Clip(start.page, y0, footer_top(page))]

    if nxt.page == start.page:
        y1 = max(nxt.y0 - 10, y0 + 36)
        return [Clip(start.page, y0, y1)]

    clips = [Clip(start.page, y0, footer_top(page))]
    for page_index in range(start.page + 1, nxt.page):
        mid = doc[page_index]
        clips.append(Clip(page_index, header_bottom(mid), footer_top(mid)))

    next_page = doc[nxt.page]
    next_header = header_bottom(next_page)
    if nxt.y0 - next_header > 40:
        clips.append(Clip(nxt.page, next_header + 2, nxt.y0 - 10))
    return clips


def _open_indexed(pdf_path: Path) -> tuple[fitz.Document, dict[int, list[Clip]]]:
    doc = fitz.open(pdf_path)
    return doc, index_questions(doc)


def extract_question_text(pdf_path: str | Path, number: int) -> str:
    doc, bands = _open_indexed(Path(pdf_path))
    clips = bands.get(number)
    if not clips:
        raise KeyError(f"No está la pregunta {number} en {pdf_path}")
    parts: list[str] = []
    for clip in clips:
        page = doc[clip.page]
        rect = fitz.Rect(page.rect.x0, clip.y0, page.rect.x1, clip.y1)
        parts.append(page.get_text(clip=rect))
    doc.close()
    return "\n".join(parts)


def crop_question_image(pdf_path: str | Path, number: int, dpi: int = DPI) -> Image.Image:
    doc, bands = _open_indexed(Path(pdf_path))
    clips = bands.get(number)
    if not clips:
        doc.close()
        raise KeyError(f"No está la pregunta {number} en {pdf_path}")
    image = _render_clips(doc, clips, dpi=dpi)
    doc.close()
    return image


def _stack(images: list[Image.Image]) -> Image.Image:
    if len(images) == 1:
        return images[0]
    width = max(image.width for image in images)
    height = sum(image.height for image in images)
    stacked = Image.new("RGB", (width, height), (255, 255, 255))
    y = 0
    for image in images:
        stacked.paste(image, (0, y))
        y += image.height
    return stacked


def fetch_m1_image_rows() -> list[dict]:
    url = (
        f"{SUPABASE_URL}/rest/v1/questions"
        "?subject=eq.M1&image_url=not.is.null&select=id,ref_code,image_url,metadata&limit=1000"
    )
    headers = {
        "apikey": os.environ.get("SUPABASE_ANON_KEY", ""),
        "Authorization": f"Bearer {os.environ.get('SUPABASE_ANON_KEY', '')}",
    }
    # Fall back to hardcoded public anon (read-only) if env missing
    if not headers["apikey"]:
        anon = (
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
            "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtc21tbHltc2pweWRwZWFsbWN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NzMwODgsImV4cCI6MjA4MTU0OTA4OH0."
            "B1I7SIA4r9FwYOkm7te40M-zxuG0WUVlzpXOj1tCmIo"
        )
        headers["apikey"] = anon
        headers["Authorization"] = f"Bearer {anon}"
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode())


def question_number_from_row(row: dict) -> int | None:
    meta = row.get("metadata") or {}
    raw = meta.get("numero_pregunta")
    if raw is not None:
        return int(raw)
    image_url = row.get("image_url") or ""
    match = re.search(r"/q(\d+)\.png$", image_url)
    if match:
        return int(match.group(1))
    return None


def recrop_all(limit: int | None = None) -> list[dict]:
    rows = fetch_m1_image_rows()
    results: list[dict] = []
    docs: dict[str, tuple[fitz.Document, dict[int, list[Clip]]]] = {}
    try:
        for row in rows:
            image_url = row.get("image_url") or ""
            folder = image_url.rsplit("/", 1)[0] if "/" in image_url else ""
            pdf_name = FOLDER_TO_PDF.get(folder)
            number = question_number_from_row(row)
            if not pdf_name or number is None:
                results.append({**row, "status": "skip_unmapped"})
                continue
            pdf_path = PDF_DIR / pdf_name
            if not pdf_path.exists():
                results.append({**row, "status": "skip_missing_pdf"})
                continue
            dest = OUT_DIR / folder / f"q{number}.png"
            dest.parent.mkdir(parents=True, exist_ok=True)
            try:
                if pdf_name not in docs:
                    docs[pdf_name] = _open_indexed(pdf_path)
                doc, bands = docs[pdf_name]
                if number not in bands:
                    results.append({**row, "status": "skip_not_in_pdf"})
                    continue
                image = _render_clips(doc, bands[number])
                image.save(dest, "PNG", optimize=True)
                results.append({**row, "status": "ok", "out": str(dest), "size": image.size})
            except Exception as exc:  # noqa: BLE001 - lote: registrar y seguir
                results.append({**row, "status": f"error:{type(exc).__name__}", "detail": str(exc)})
            if limit and sum(1 for item in results if item.get("status") == "ok") >= limit:
                break
    finally:
        for doc, _bands in docs.values():
            doc.close()
    return results


def _render_clips(doc: fitz.Document, clips: list[Clip], dpi: int = DPI) -> Image.Image:
    zoom = dpi / 72
    matrix = fitz.Matrix(zoom, zoom)
    images: list[Image.Image] = []
    for clip in clips:
        page = doc[clip.page]
        rect = fitz.Rect(page.rect.x0, clip.y0, page.rect.x1, clip.y1)
        pix = page.get_pixmap(matrix=matrix, clip=rect, alpha=False)
        images.append(Image.frombytes("RGB", [pix.width, pix.height], pix.samples))
    return _stack(images)


def upload_png(local: Path, object_path: str) -> None:
    if not SUPABASE_KEY:
        raise RuntimeError("Falta SUPABASE_SERVICE_KEY para subir a Storage")
    url = f"{SUPABASE_URL}/storage/v1/object/questions-images/{object_path}"
    data = local.read_bytes()
    req = urllib.request.Request(
        url,
        data=data,
        method="PUT",
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "image/png",
            "x-upsert": "true",
        },
    )
    try:
        with urllib.request.urlopen(req) as response:
            response.read()
    except urllib.error.HTTPError as exc:
        raise RuntimeError(f"upload {object_path} failed: {exc.read().decode()[:300]}") from exc


def main(argv: Iterable[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Recortar imágenes M1 desde PDF oficiales")
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--upload", action="store_true")
    args = parser.parse_args(list(argv) if argv is not None else None)

    results = recrop_all(limit=args.limit)
    ok = [item for item in results if item.get("status") == "ok"]
    skipped = [item for item in results if item.get("status") != "ok"]
    print(f"recortadas {len(ok)} / {len(results)}")
    counts: dict[str, int] = {}
    for item in skipped:
        counts[item.get("status", "?")] = counts.get(item.get("status", "?"), 0) + 1
    if counts:
        print("omitidas:", counts)

    if args.upload:
        uploaded = 0
        for item in ok:
            object_path = item["image_url"]
            upload_png(Path(item["out"]), object_path)
            uploaded += 1
            print("subida", object_path)
        print(f"subidas {uploaded}")
    else:
        print(f"archivos en {OUT_DIR} (sin subir)")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
