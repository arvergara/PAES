#!/usr/bin/env python3
"""Inserta preguntas de Matemática M1 PAES en Supabase.

Uso:
    python load_m1_questions.py

Requiere SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_SERVICE_KEY (ver Nuevo_PAES/.env).
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
DATA_FILE = BASE_DIR / "pruebas" / "m1_question_bank.json"
REQUIRED_ENV = ("SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_KEY")


def ensure_env() -> dict[str, str]:
    load_dotenv()
    missing = [name for name in REQUIRED_ENV if not os.getenv(name)]
    if missing:
        print(f"Faltan variables de entorno: {', '.join(missing)}", file=sys.stderr)
        sys.exit(1)
    return {name: os.environ[name] for name in REQUIRED_ENV}


def read_questions() -> list[dict]:
    if not DATA_FILE.exists():
        print(f"No se encontró el archivo {DATA_FILE}", file=sys.stderr)
        sys.exit(1)
    with DATA_FILE.open(encoding="utf-8") as fh:
        payload = json.load(fh)
    preguntas = payload.get("preguntas")
    if not isinstance(preguntas, list):
        print("Formato inesperado: se esperaba la clave 'preguntas' con una lista", file=sys.stderr)
        sys.exit(1)
    return preguntas


def normalise_options(raw: list[str]) -> list[dict[str, str]]:
    """M1 tiene 4 opciones (A-D)"""
    import re
    opciones = raw[:4]
    while len(opciones) < 4:
        opciones.append("")
    labels = ["a", "b", "c", "d"]

    # Clean prefixes like "A)", "B)", etc.
    cleaned = []
    for text in opciones:
        # Remove patterns like "A) ", "B) ", etc. at the start
        cleaned_text = re.sub(r'^[A-D]\)\s*', '', text)
        cleaned.append(cleaned_text)

    return [{"label": label, "text": cleaned[idx] or ""} for idx, label in enumerate(labels)]


def build_payload(pregunta: dict) -> dict:
    alternativas = pregunta.get("alternativas")
    if not isinstance(alternativas, list):
        alternativas = []

    return {
        "subject": "M1",
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


def insert_questions(env: dict[str, str], preguntas: list[dict]) -> None:
    base_url = env["SUPABASE_URL"].rstrip("/")
    endpoint = f"{base_url}/rest/v1/questions"
    headers = {
        "apikey": env["SUPABASE_ANON_KEY"],
        "Authorization": f"Bearer {env['SUPABASE_SERVICE_KEY']}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    for idx, pregunta in enumerate(preguntas, start=1):
        payload = build_payload(pregunta)
        response = requests.post(endpoint, headers=headers, data=json.dumps(payload))
        if not response.ok:
            print(f"Error en la pregunta {idx} (HTTP {response.status_code}): {response.text}", file=sys.stderr)
            sys.exit(1)
        if idx % 10 == 0:
            print(f"{idx} preguntas insertadas")
        time.sleep(0.05)

    print(f"Inserción completa: {len(preguntas)} preguntas de M1")


def main() -> None:
    env = ensure_env()
    preguntas = read_questions()
    print(f"Leyendo {len(preguntas)} preguntas M1 desde {DATA_FILE}")
    insert_questions(env, preguntas)


if __name__ == "__main__":
    main()
