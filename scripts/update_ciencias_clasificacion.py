#!/usr/bin/env python3
"""Actualiza area_tematica/tema del banco de Ciencias reprocesado.

Lee scripts/output/rebuild/clasificacion/*.json (producidos por los agentes
clasificadores) y actualiza cada fila del lote 'ciencias_oficial_2026' vía
PostgREST, matcheando por metadata->>src = "<base>#<numero>".

Requiere SUPABASE_URL y SUPABASE_SERVICE_KEY en el entorno (.env.rebuild).
"""
import json
import os
import re
import sys
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent
REBUILD = ROOT / "output" / "rebuild"
CLASIF = REBUILD / "clasificacion"

EJES_VALIDOS = {
    # Biología
    "Organización, estructura y actividad celular",
    "Procesos y funciones biológicas",
    "Herencia y evolución",
    "Organismo y ambiente",
    # Física
    "Ondas", "Mecánica", "Energía", "Electricidad y magnetismo", "Universo",
    # Química
    "Estructura atómica", "Química orgánica",
    "Reacciones químicas y estequiometría", "Disoluciones químicas",
}


def load_env():
    env_file = ROOT.parent / ".env.rebuild"
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())


def validate() -> list[dict]:
    """Valida clasificaciones contra los bancos fuente. Devuelve updates."""
    updates, problems = [], []
    fuentes = sorted(REBUILD.glob("C[BFQ]_*.json"))
    for src_file in fuentes:
        base = src_file.stem
        cls_file = CLASIF / f"{base}.json"
        if not cls_file.exists():
            problems.append(f"FALTA clasificación: {base}")
            continue
        fuente = json.loads(src_file.read_text())
        cls = json.loads(cls_file.read_text())
        numeros_fuente = {p["numero"] for p in fuente["preguntas"]}
        numeros_cls = {c["numero"] for c in cls["clasificacion"]}
        if numeros_fuente != numeros_cls:
            problems.append(
                f"{base}: numeros no calzan (faltan {sorted(numeros_fuente - numeros_cls)[:5]}, "
                f"sobran {sorted(numeros_cls - numeros_fuente)[:5]})"
            )
        for c in cls["clasificacion"]:
            eje = (c.get("area_tematica") or "").strip()
            # Algunos agentes antepusieron la disciplina ("Biología: X") — se tolera
            eje = re.sub(r"^(Biología|Física|Química):\s*", "", eje)
            tema = (c.get("tema") or "").strip()
            if eje not in EJES_VALIDOS:
                problems.append(f"{base}#{c['numero']}: eje inválido: {eje!r}")
                continue
            if not tema:
                problems.append(f"{base}#{c['numero']}: tema vacío")
                continue
            updates.append({"src": f"{base}#{c['numero']}", "area_tematica": eje, "tema": tema})
    if problems:
        print(f"⚠️  {len(problems)} problemas:")
        for p in problems[:30]:
            print(f"   - {p}")
        if len(problems) > 30:
            print(f"   ... y {len(problems) - 30} más")
    return updates if not any("FALTA" in p or "no calzan" in p for p in problems) else []


def patch_row(session: requests.Session, url: str, headers: dict, u: dict) -> tuple[str, bool]:
    src = urllib.parse.quote(u["src"], safe="")
    r = session.patch(
        f"{url}/rest/v1/questions?lote=eq.ciencias_oficial_2026&metadata-%3E%3Esrc=eq.{src}",
        headers=headers,
        json={"area_tematica": u["area_tematica"], "tema": u["tema"]},
        timeout=30,
    )
    return u["src"], r.ok


def main():
    load_env()
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        sys.exit("Faltan SUPABASE_URL / SUPABASE_SERVICE_KEY (.env.rebuild)")

    updates = validate()
    if not updates:
        sys.exit("Validación falló o sin updates — no se toca la BD.")
    print(f"✓ Validación OK: {len(updates)} preguntas a actualizar")
    if "--dry-run" in sys.argv:
        return

    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Prefer": "return=minimal",
        "Content-Type": "application/json",
    }
    ok, fail = 0, []
    with requests.Session() as session, ThreadPoolExecutor(max_workers=8) as pool:
        futures = [pool.submit(patch_row, session, url, headers, u) for u in updates]
        for f in as_completed(futures):
            src, success = f.result()
            if success:
                ok += 1
                if ok % 200 == 0:
                    print(f"   {ok}/{len(updates)}...")
            else:
                fail.append(src)
    print(f"✓ {ok} actualizadas, {len(fail)} fallidas")
    if fail:
        print("Fallidas:", fail[:20])


if __name__ == "__main__":
    main()
