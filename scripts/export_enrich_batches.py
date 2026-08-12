#!/usr/bin/env python3
"""Exporta preguntas activas de M1/M2 a lotes JSON para enriquecimiento.

Cada lote (scripts/output/enrich/{SUBJ}_batch_NN.json) trae id, content,
options, correct_answer y contexto, para que agentes offline generen
explicación + diagnóstico por distractor validando contra la clave.
"""
import json
import os
import sys
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "output" / "enrich"
BATCH_SIZE = 50


def load_env():
    env_file = ROOT.parent / ".env.rebuild"
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())


def fetch_all(url: str, headers: dict, subject: str) -> list[dict]:
    rows, offset = [], 0
    while True:
        r = requests.get(
            f"{url}/rest/v1/questions",
            headers=headers,
            params={
                "subject": f"eq.{subject}",
                "active": "eq.true",
                "select": "id,subject,content,options,correct_answer,area_tematica,tema,image_url,explanation",
                "order": "id",
                "offset": offset,
                "limit": 500,
            },
            timeout=60,
        )
        r.raise_for_status()
        chunk = r.json()
        rows.extend(chunk)
        if len(chunk) < 500:
            return rows
        offset += 500


def main():
    load_env()
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        sys.exit("Faltan SUPABASE_URL / SUPABASE_SERVICE_KEY (.env.rebuild)")
    headers = {"apikey": key, "Authorization": f"Bearer {key}"}

    OUT.mkdir(parents=True, exist_ok=True)
    total_batches = 0
    for subject in ("M1", "M2"):
        rows = fetch_all(url, headers, subject)
        print(f"{subject}: {len(rows)} preguntas activas")
        for i in range(0, len(rows), BATCH_SIZE):
            n = i // BATCH_SIZE + 1
            path = OUT / f"{subject}_batch_{n:02d}.json"
            path.write_text(json.dumps(rows[i:i + BATCH_SIZE], ensure_ascii=False, indent=1))
            total_batches += 1
    print(f"✓ {total_batches} lotes en {OUT}")


if __name__ == "__main__":
    main()
