"""Inserta preguntas de Historia PAES en Supabase.

Uso:
    python load_questions_h.py
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
DATA_FILE = BASE_DIR / "pruebas" / "h_question_bank.json"
REQUIRED_ENV = ("SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_KEY")


H_ALLOWED_TEMAS = {
    "Edad Contemporánea",
    "Totalitarismos y Guerra Mundial",
    "Nuevo Orden Mundial",
    "Chile en el siglo XIX",
    "Formación de la República",
    "Inserción Internacional",
    "Geografía física de Chile",
    "Recursos naturales",
    "Desarrollo económico",
}


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
    import re
    opciones = raw[:5]
    while len(opciones) < 5:
        opciones.append("")
    labels = ["a", "b", "c", "d", "e"]

    # Clean prefixes like "A)", "B)", etc.
    cleaned = []
    for text in opciones:
        # Remove patterns like "A) ", "B) ", etc. at the start
        cleaned_text = re.sub(r'^[A-E]\)\s*', '', text)
        cleaned.append(cleaned_text)

    return [{"label": label, "text": cleaned[idx] or ""} for idx, label in enumerate(labels)]


def map_history_fields(area: str | None, tema: str | None) -> tuple[str, str]:
    area = (area or "").strip()
    tema = (tema or "").strip()
    tema_lower = tema.lower()

    if "siglo xix" in tema_lower:
        mapped_tema = "Chile en el siglo XIX"
    elif "sistema econom" in tema_lower or "mercado" in tema_lower:
        mapped_tema = "Desarrollo económico"
    elif "segunda mitad del siglo xx" in tema_lower or "nuevo orden" in tema_lower:
        mapped_tema = "Nuevo Orden Mundial"
    elif "primera mitad del siglo xx" in tema_lower or "totalitar" in tema_lower:
        mapped_tema = "Totalitarismos y Guerra Mundial"
    elif "sociedad democr" in tema_lower or "formacion ciudadana" in tema_lower:
        mapped_tema = "Formación de la República"
    elif "cambios politico" in tema_lower:
        mapped_tema = "Formación de la República"
    elif "geografia" in tema_lower or "territorio" in tema_lower or "recursos" in tema_lower:
        mapped_tema = "Geografía física de Chile"
    elif tema_lower == "unknown" or not tema_lower:
        mapped_tema = "Edad Contemporánea"
    else:
        mapped_tema = "Edad Contemporánea"

    if mapped_tema not in H_ALLOWED_TEMAS:
        mapped_tema = "Edad Contemporánea"

    area_lower = area.lower()
    if area_lower == "historia":
        mapped_area = "Historia de Chile" if "chile" in tema_lower else "Historia Universal"
    elif area_lower == "formacion ciudadana":
        mapped_area = "Historia de Chile"
    elif area_lower == "sistema economico":
        mapped_area = "Geografía"
    else:
        mapped_area = "Historia Universal"

    return mapped_area, mapped_tema


def build_payload(pregunta: dict) -> dict:
    alternativas = pregunta.get("alternativas")
    if not isinstance(alternativas, list):
        alternativas = []

    mapped_area, mapped_tema = map_history_fields(
        pregunta.get("area_tematica"), pregunta.get("tema")
    )

    return {
        "subject": "H",
        "content": pregunta.get("texto", ""),
        "options": normalise_options(alternativas),
        "correct_answer": (pregunta.get("correcta") or "a").lower(),
        "explanation": pregunta.get("explicacion", ""),
        "area_tematica": mapped_area,
        "tema": mapped_tema,
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

    print(f"Inserción completa: {len(preguntas)} preguntas")


def main() -> None:
    env = ensure_env()
    preguntas = read_questions()
    print(f"Leyendo {len(preguntas)} preguntas desde {DATA_FILE}")
    insert_questions(env, preguntas)


if __name__ == "__main__":
    main()
