#!/usr/bin/env python3
"""Recorta las figuras de las preguntas marcadas tiene_figura=true en los JSON
de scripts/output/rebuild/, usando la geometria vectorial del PDF oficial.

Salida: PNGs en scripts/output/rebuild/images/{CODE}_{tag}_q{num}.png
        + reporte crop_report.json con exito/fallo por pregunta.

Uso: .venv-rebuild/bin/python scripts/rebuild_crop_figures.py
"""
import fitz, json, glob, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTDIR = os.path.join(ROOT, "scripts/output/rebuild/images")
os.makedirs(OUTDIR, exist_ok=True)

MARKERS = ("[Figura", "[Diagrama", "[Gráfico", "[Grafico", "[Esquema", "[Imagen", "[Estructura", "[Tabla")

# mapea code -> slug de archivo PDF
SLUG = {"CB": "biologia", "CF": "fisica", "CQ": "quimica"}


def clean(s):
    return re.sub(r"\s+", " ", s).strip()


def first_marker_idx(text):
    idxs = [text.find(m) for m in MARKERS if text.find(m) >= 0]
    return min(idxs) if idxs else -1


def search_page(doc, snippet):
    """Devuelve (pno, rect) de la primera ocurrencia; prueba snippet cada vez mas corto."""
    for n in (len(snippet), 45, 30, 20):
        s = clean(snippet)[:n]
        if len(s) < 12:
            break
        for pno in range(len(doc)):
            rects = doc[pno].search_for(s)
            if rects:
                return pno, rects[0]
    return None, None


def y_of(page, snippet, after=0.0):
    if not snippet:
        return None
    for n in (60, 40, 25):
        s = clean(snippet)[:n]
        if len(s) < 10:
            break
        rects = [r for r in page.search_for(s) if r.y0 >= after - 1]
        if rects:
            return rects[0]
    return None


def graphics_bbox(page, y0, y1, pad=8):
    W, H = page.rect.width, page.rect.height
    boxes = []
    for d in page.get_drawings():
        b = d["rect"]
        if b.y0 >= y0 - 3 and b.y1 <= y1 + 3 and b.width < 0.93 * W and b.height > 3 and b.width > 3:
            boxes.append(b)
    for info in page.get_image_info():
        b = fitz.Rect(info["bbox"])
        if b.y0 >= y0 - 3 and b.y1 <= y1 + 3:
            boxes.append(b)
    if not boxes:
        return None
    fig = boxes[0]
    for b in boxes[1:]:
        fig = fig | b
    return fitz.Rect(max(0, fig.x0 - pad), max(0, fig.y0 - pad),
                     min(W, fig.x1 + pad), min(H, fig.y1 + pad)), len(boxes)


def process_exam(path, report):
    d = json.load(open(path))
    code = d["meta"]["subject"]
    base = os.path.basename(path).replace(".json", "")   # p.ej CF_2025-1
    tag = base.split("_", 1)[1]
    pdf = os.path.join(ROOT, f"pruebas/oficiales/C-{SLUG[code]}-{tag}.pdf")
    if not os.path.exists(pdf):
        report.append({"exam": base, "error": f"PDF no encontrado: {pdf}"})
        return
    doc = fitz.open(pdf)
    qs = d["preguntas"]
    by_num = {q["numero"]: q for q in qs}

    for q in qs:
        if not q.get("tiene_figura"):
            continue
        num = q["numero"]
        content = q.get("content", "")
        opts = q.get("options") or {}
        fig_in_options = any(first_marker_idx(str(v)) >= 0 for v in opts.values())

        mi = first_marker_idx(content)
        if mi >= 0:
            stem_pre = content[:mi]
            after_text = clean(content[content.find("]", mi) + 1:])
        else:
            # sin marcador: la figura suele ir entre la intro y la señal de pregunta
            CUES = ("¿", "De acuerdo", "Basándose", "Basandose", "Del análisis",
                    "Del analisis", "A partir", "Según", "Segun", "Con base",
                    "Considerando", "En base", "Respecto")
            pos = [content.find(c) for c in CUES if content.find(c) > 20]
            qpos = min(pos) if pos else -1
            stem_pre = content[:qpos] if qpos > 0 else content
            after_text = clean(content[qpos:]) if qpos > 0 else ""
        # ancla de pagina: inicio del enunciado
        pno, r_stem = search_page(doc, stem_pre[:60] or content[:60])
        rec = {"exam": base, "num": num, "fig_in_options": fig_in_options}
        if pno is None:
            rec["status"] = "no_ubicada"
            report.append(rec); continue
        page = doc[pno]; H = page.rect.height

        # y_start: fin de la linea que introduce la figura (ultima linea del pre)
        pre_tail = clean(stem_pre)[-55:] if stem_pre.strip() else None
        r_ytail = y_of(page, pre_tail, after=r_stem.y0) if pre_tail else None
        y_start = (r_ytail.y1 if r_ytail else r_stem.y1)

        # y_end
        if fig_in_options:
            nxt = by_num.get(num + 1)
            r_end = y_of(page, clean(nxt["content"])[:45], after=y_start) if nxt else None
            y_end = r_end.y0 if r_end else H - 40
        else:
            r_end = y_of(page, after_text[:45], after=y_start) if after_text else None
            if not r_end:  # figura seguida directo por opciones
                oa = clean(str(opts.get("a", "")))[:40]
                r_end = y_of(page, oa, after=y_start) if oa else None
            y_end = r_end.y0 if r_end else H - 40

        if y_end - y_start < 15:
            y_end = min(H - 40, y_start + 260)  # fallback: ventana fija

        gb = graphics_bbox(page, y_start, y_end)
        if not gb:
            rec["status"] = "sin_graficos"; rec["page"] = pno
            report.append(rec); continue
        clip, ngraf = gb
        if clip.height < 12 or clip.width < 12:
            rec["status"] = "bbox_minimo"; report.append(rec); continue
        pix = page.get_pixmap(dpi=200, clip=clip)
        fname = f"{base}_q{num}.png"
        pix.save(os.path.join(OUTDIR, fname))
        rec.update(status="ok", page=pno, ngraf=ngraf,
                   w=pix.width, h=pix.height, file=fname)
        report.append(rec)
    doc.close()


def main():
    report = []
    for path in sorted(glob.glob(os.path.join(ROOT, "scripts/output/rebuild/*.json"))):
        process_exam(path, report)
    json.dump(report, open(os.path.join(OUTDIR, "crop_report.json"), "w"),
              ensure_ascii=False, indent=2)
    ok = [r for r in report if r.get("status") == "ok"]
    fail = [r for r in report if r.get("status") != "ok"]
    from collections import Counter
    print(f"TOTAL figuras procesadas: {len(report)}")
    print(f"  OK: {len(ok)}")
    print(f"  FALLO: {len(fail)} -> {Counter(r.get('status') or r.get('error','?') for r in fail)}")
    print(f"  (fig en opciones: {sum(1 for r in report if r.get('fig_in_options'))})")


if __name__ == "__main__":
    main()
