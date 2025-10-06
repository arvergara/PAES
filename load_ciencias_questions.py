#!/usr/bin/env python3
"""Inserta preguntas de Ciencias PAES en Supabase (Biología, Física, Química).

Uso:
    python load_ciencias_questions.py

Requiere SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_SERVICE_KEY (ver .env).
"""
from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path

import requests
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
REQUIRED_ENV = ("SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_KEY")


def ensure_env() -> dict[str, str]:
    load_dotenv()
    missing = [name for name in REQUIRED_ENV if not os.getenv(name)]
    if missing:
        print(f"Faltan variables de entorno: {', '.join(missing)}", file=sys.stderr)
        sys.exit(1)
    return {name: os.environ[name] for name in REQUIRED_ENV}


def read_questions(file_path: Path) -> list[dict]:
    if not file_path.exists():
        print(f"No se encontró el archivo {file_path}", file=sys.stderr)
        sys.exit(1)
    with file_path.open(encoding="utf-8") as fh:
        payload = json.load(fh)
    preguntas = payload.get("preguntas", payload if isinstance(payload, list) else [])
    if not isinstance(preguntas, list):
        print("Formato inesperado: se esperaba la clave 'preguntas' con una lista", file=sys.stderr)
        sys.exit(1)
    return preguntas


def normalise_options(raw: list[str]) -> list[dict[str, str]]:
    """Ciencias tiene 4 opciones (A-D)"""
    import re
    opciones = raw[:4]
    while len(opciones) < 4:
        opciones.append("")
    labels = ["a", "b", "c", "d"]

    # Clean prefixes
    cleaned = []
    for text in opciones:
        cleaned_text = re.sub(r'^[A-D]\)\s*', '', text)
        cleaned.append(cleaned_text)

    return [{"label": label, "text": cleaned[idx] or ""} for idx, label in enumerate(labels)]


def build_payload(pregunta: dict, subject_code: str) -> dict:
    alternativas = pregunta.get("alternativas")
    if not isinstance(alternativas, list):
        alternativas = []

    return {
        "subject": subject_code,
        "content": pregunta.get("texto", ""),
        "options": normalise_options(alternativas),
        "correct_answer": (pregunta.get("correcta") or "a").lower(),
        "explanation": pregunta.get("explicacion", ""),
        "area_tematica": pregunta.get("area_tematica"),
        "tema": pregunta.get("tema"),
        "subtema": pregunta.get("subtema"),
        "difficulty": pregunta.get("dificultad", 1),
        "active": True,
        "habilidad": pregunta.get("habilidad"),
    }


def insert_questions(env: dict[str, str], preguntas: list[dict], subject_code: str, subject_name: str) -> None:
    base_url = env["SUPABASE_URL"].rstrip("/")
    endpoint = f"{base_url}/rest/v1/questions"
    headers = {
        "apikey": env["SUPABASE_ANON_KEY"],
        "Authorization": f"Bearer {env['SUPABASE_SERVICE_KEY']}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    print(f"\nInsertando {subject_name} ({subject_code})...")

    for idx, pregunta in enumerate(preguntas, start=1):
        payload = build_payload(pregunta, subject_code)
        response = requests.post(endpoint, headers=headers, data=json.dumps(payload))
        if not response.ok:
            print(f"Error en la pregunta {idx} (HTTP {response.status_code}): {response.text[:200]}", file=sys.stderr)
            sys.exit(1)
        if idx % 25 == 0:
            print(f"  {idx} preguntas insertadas")
        time.sleep(0.05)

    print(f"✓ Inserción completa: {len(preguntas)} preguntas de {subject_name}")


def main() -> None:
    env = ensure_env()

    subjects = [
        ("CB", "Biología", BASE_DIR / "pruebas" / "cb_question_bank.json"),
        ("CF", "Física", BASE_DIR / "pruebas" / "cf_question_bank.json"),
        ("CQ", "Química", BASE_DIR / "pruebas" / "cq_question_bank.json"),
    ]

    print("="*80)
    print("CARGA DE PREGUNTAS DE CIENCIAS A SUPABASE")
    print("="*80)

    total = 0
    for subject_code, subject_name, file_path in subjects:
        preguntas = read_questions(file_path)
        print(f"\n{subject_name}: {len(preguntas)} preguntas")
        insert_questions(env, preguntas, subject_code, subject_name)
        total += len(preguntas)

    print(f"\n{'='*80}")
    print(f"✅ TOTAL: {total} preguntas de Ciencias cargadas")
    print(f"{'='*80}\n")


if __name__ == "__main__":
    main()
