#!/usr/bin/env python3
"""Carga explicaciones + diagnóstico por distractor generados offline.

Lee scripts/output/enrich/out/*.json, valida contra los lotes de entrada
(ids, opciones, clave) y actualiza questions vía PostgREST. Solo escribe
filas con matches_key=true; las discrepancias de clave quedan en
key_mismatches.json para revisión manual — nunca se fuerza una explicación
sobre una clave dudosa.

Requiere SUPABASE_URL / SUPABASE_SERVICE_KEY (.env.rebuild).
Uso: load_enrichment.py [--dry-run]
"""
import json
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent
ENRICH = ROOT / "output" / "enrich"
OUT = ENRICH / "out"


def load_env():
    env_file = ROOT.parent / ".env.rebuild"
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())


def collect() -> tuple[list[dict], list[dict], dict]:
    """Devuelve (updates, mismatches, stats)."""
    inputs = {}
    for f in ENRICH.glob("M*_batch_*.json"):
        for q in json.loads(f.read_text()):
            inputs[q["id"]] = q

    updates, mismatches = [], []
    stats = {"files": 0, "entries": 0, "ok": 0, "mismatch": 0, "skipped": 0, "invalid": 0}
    for f in sorted(OUT.glob("M*_batch_*.json")):
        stats["files"] += 1
        for e in json.loads(f.read_text()):
            stats["entries"] += 1
            src = inputs.get(e.get("id"))
            if not src:
                stats["invalid"] += 1
                continue
            if e.get("skip_reason"):
                stats["skipped"] += 1
                continue
            if e.get("matches_key") is not True:
                stats["mismatch"] += 1
                mismatches.append({
                    "id": e["id"],
                    "subject": src["subject"],
                    "key": src["correct_answer"],
                    "verified": e.get("verified_answer"),
                    "content": (src.get("content") or "")[:120],
                })
                continue
            explanation = (e.get("explanation") or "").strip()
            if not explanation:
                stats["invalid"] += 1
                continue
            # Solo diagnósticos de alternativas incorrectas existentes, sin nulls
            opts = src.get("options") or {}
            key = (src.get("correct_answer") or "").lower()
            diag = {
                k.lower(): v.strip()
                for k, v in (e.get("distractor_diagnosis") or {}).items()
                if v and k.lower() in opts and k.lower() != key
            }
            updates.append({
                "id": e["id"],
                "explanation": explanation,
                "distractor_diagnosis": diag or None,
            })
            stats["ok"] += 1
    return updates, mismatches, stats


def patch_row(session, url, headers, u) -> tuple[str, bool]:
    r = session.patch(
        f"{url}/rest/v1/questions?id=eq.{u['id']}",
        headers=headers,
        json={"explanation": u["explanation"], "distractor_diagnosis": u["distractor_diagnosis"]},
        timeout=30,
    )
    return u["id"], r.ok


def main():
    load_env()
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        sys.exit("Faltan SUPABASE_URL / SUPABASE_SERVICE_KEY (.env.rebuild)")

    updates, mismatches, stats = collect()
    (ENRICH / "key_mismatches.json").write_text(json.dumps(mismatches, ensure_ascii=False, indent=1))
    print(f"Archivos: {stats['files']} | entradas: {stats['entries']} | "
          f"OK: {stats['ok']} | clave dudosa: {stats['mismatch']} | "
          f"saltadas (figura): {stats['skipped']} | inválidas: {stats['invalid']}")
    if "--dry-run" in sys.argv or not updates:
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
            qid, success = f.result()
            if success:
                ok += 1
                if ok % 200 == 0:
                    print(f"   {ok}/{len(updates)}...")
            else:
                fail.append(qid)
    print(f"✓ {ok} actualizadas, {len(fail)} fallidas")
    if fail:
        print("Fallidas:", fail[:20])


if __name__ == "__main__":
    main()
