#!/usr/bin/env python3
"""Inserta preguntas generadas (JSON) en Supabase.

Companion script para el skill /generate-questions de Claude Code.
Lee un archivo JSON con preguntas y las inserta en la tabla `questions` de Supabase.

Soporta dos formatos:
- Plano: [{content, options, ...}, ...] (M1, M2, H, CB, CF, CQ)
- Agrupado: [{reading_text: {...}, questions: [...]}, ...] (Lenguaje)

Uso:
    python scripts/insert_questions.py questions.json M1
    python scripts/insert_questions.py questions.json L
    python scripts/insert_questions.py questions.json CB --threshold 0.9

Requiere: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY (en .env o entorno)
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path

import requests
from dotenv import load_dotenv

REQUIRED_ENV = ("SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_KEY")
DEFAULT_THRESHOLD = 0.8


def ensure_env() -> dict[str, str]:
    load_dotenv()
    missing = [name for name in REQUIRED_ENV if not os.getenv(name)]
    if missing:
        print(f"Faltan variables de entorno: {', '.join(missing)}", file=sys.stderr)
        sys.exit(1)
    return {name: os.environ[name] for name in REQUIRED_ENV}


def api_headers(env: dict[str, str]) -> dict[str, str]:
    return {
        "apikey": env["SUPABASE_ANON_KEY"],
        "Authorization": f"Bearer {env['SUPABASE_SERVICE_KEY']}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def base_url(env: dict[str, str]) -> str:
    return env["SUPABASE_URL"].rstrip("/")


def insert_reading_text(env: dict[str, str], reading: dict) -> int | None:
    """Inserta un texto de lectura en reading_texts. Retorna el ID o None."""
    endpoint = f"{base_url(env)}/rest/v1/reading_texts"
    payload = {
        "title": reading.get("title", ""),
        "source": reading.get("source", ""),
        "content": reading.get("content", ""),
    }
    resp = requests.post(endpoint, headers=api_headers(env), data=json.dumps(payload))
    if not resp.ok:
        print(f"  ERROR insertando reading_text HTTP {resp.status_code}: {resp.text[:200]}", file=sys.stderr)
        return None
    data = resp.json()
    if isinstance(data, list) and len(data) > 0:
        return data[0].get("id")
    return None


def build_question_payload(
    question: dict, subject: str, threshold: float,
    reading_text_id: int | None = None,
) -> dict:
    """Construye el payload para insertar una pregunta."""
    meta = question.get("_meta", {})
    confidence = float(meta.get("confidence", 0.0))
    is_active = confidence >= threshold and not meta.get("issues") or meta.get("issues") == "Ninguno"
    is_active = confidence >= threshold and meta.get("active", False)

    payload = {
        "subject": subject,
        "content": question["content"],
        "options": question["options"],
        "correct_answer": question["correct_answer"],
        "explanation": question.get("explanation", ""),
        "area_tematica": question.get("area_tematica", ""),
        "tema": question.get("tema", ""),
        "subtema": question.get("subtema", ""),
        "difficulty": question.get("difficulty", 3),
        "habilidad": question.get("habilidad", ""),
        "active": is_active,
        "review_status": "approved" if is_active else "pending",
        "classification_confidence": confidence,
        "ai_classification": json.dumps({"confidence": confidence, "issues": meta.get("issues", "")}),
        "origen": "ai-generated",
        "has_visual_content": False,
        "metadata": json.dumps({
            "generated_at": datetime.now().isoformat(),
            "generator": "claude-code-skill",
            "confidence": confidence,
            "issues": meta.get("issues", ""),
        }),
    }

    if reading_text_id is not None:
        payload["reading_text_id"] = reading_text_id
    if "question_number" in question:
        payload["question_number"] = question["question_number"]

    return payload


def insert_question(env: dict[str, str], payload: dict) -> bool:
    """Inserta una pregunta en Supabase. Retorna True si fue exitoso."""
    endpoint = f"{base_url(env)}/rest/v1/questions"
    headers = api_headers(env)
    headers["Prefer"] = "return=minimal"

    resp = requests.post(endpoint, headers=headers, data=json.dumps(payload))
    if not resp.ok:
        print(f"  ERROR HTTP {resp.status_code}: {resp.text[:200]}", file=sys.stderr)
        return False
    return True


def is_lenguaje_format(data: list) -> bool:
    """Detecta si el JSON tiene formato agrupado de Lenguaje (reading_text + questions)."""
    if not data:
        return False
    return isinstance(data[0], dict) and "reading_text" in data[0] and "questions" in data[0]


def process_lenguaje(env: dict[str, str], data: list, threshold: float) -> dict:
    """Procesa e inserta preguntas de Lenguaje (con textos de lectura)."""
    stats = {"texts": 0, "inserted": 0, "active": 0, "pending": 0, "errors": 0}

    for group in data:
        reading = group.get("reading_text", {})
        questions = group.get("questions", [])

        print(f"\n  Texto: \"{reading.get('title', 'Sin título')}\" ({len(questions)} preguntas)")

        # Insertar texto de lectura
        reading_id = insert_reading_text(env, reading)
        if reading_id is None:
            print(f"    Error insertando texto, saltando grupo", file=sys.stderr)
            stats["errors"] += len(questions)
            continue
        stats["texts"] += 1
        print(f"    reading_text_id = {reading_id}")

        # Insertar preguntas del grupo
        for q in questions:
            payload = build_question_payload(q, "L", threshold, reading_text_id=reading_id)
            if insert_question(env, payload):
                stats["inserted"] += 1
                if payload["active"]:
                    stats["active"] += 1
                else:
                    stats["pending"] += 1
            else:
                stats["errors"] += 1
            time.sleep(0.1)

    return stats


def process_standard(env: dict[str, str], data: list, subject: str, threshold: float) -> dict:
    """Procesa e inserta preguntas estándar (sin texto de lectura)."""
    stats = {"inserted": 0, "active": 0, "pending": 0, "errors": 0}

    for i, q in enumerate(data, 1):
        payload = build_question_payload(q, subject, threshold)
        if insert_question(env, payload):
            stats["inserted"] += 1
            if payload["active"]:
                stats["active"] += 1
            else:
                stats["pending"] += 1
            if i % 10 == 0:
                print(f"  {i}/{len(data)} insertadas...")
        else:
            stats["errors"] += 1
        time.sleep(0.1)

    return stats


def main() -> None:
    parser = argparse.ArgumentParser(description="Insertar preguntas PAES en Supabase desde JSON")
    parser.add_argument("json_file", help="Archivo JSON con las preguntas generadas")
    parser.add_argument("subject", help="Código de asignatura: M1, M2, L, H, CB, CF, CQ")
    parser.add_argument("--threshold", type=float, default=DEFAULT_THRESHOLD,
                        help=f"Umbral de confianza para activación (default: {DEFAULT_THRESHOLD})")
    args = parser.parse_args()

    json_path = Path(args.json_file)
    if not json_path.exists():
        print(f"No se encontró {json_path}", file=sys.stderr)
        sys.exit(1)

    with json_path.open(encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, list):
        print("El JSON debe ser un arreglo", file=sys.stderr)
        sys.exit(1)

    env = ensure_env()

    if args.subject == "L" and is_lenguaje_format(data):
        total_q = sum(len(g.get("questions", [])) for g in data)
        print(f"Insertando {len(data)} textos con {total_q} preguntas de Lenguaje (threshold={args.threshold})")
        stats = process_lenguaje(env, data, args.threshold)
        print(f"\nResultado:")
        print(f"  Textos insertados: {stats['texts']}")
        print(f"  Preguntas insertadas: {stats['inserted']}")
        print(f"  Activas:    {stats['active']}")
        print(f"  Pendientes: {stats['pending']}")
        if stats["errors"]:
            print(f"  Errores:    {stats['errors']}")
    else:
        print(f"Insertando {len(data)} preguntas de {args.subject} (threshold={args.threshold})")
        stats = process_standard(env, data, args.subject, args.threshold)
        print(f"\nResultado:")
        print(f"  Insertadas: {stats['inserted']}/{len(data)}")
        print(f"  Activas:    {stats['active']}")
        print(f"  Pendientes: {stats['pending']}")
        if stats["errors"]:
            print(f"  Errores:    {stats['errors']}")


if __name__ == "__main__":
    main()
