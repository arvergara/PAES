#!/usr/bin/env python3
"""Pipeline end-to-end de generación de preguntas PAES con Claude.

Genera preguntas usando Claude API, las valida, auto-verifica y sube a Supabase.

Uso:
    python scripts/generate_pipeline.py --subject M1 --count 50
    python scripts/generate_pipeline.py --subject ALL --count 20
    python scripts/generate_pipeline.py --subject H --count 10 --dry-run
    python scripts/generate_pipeline.py --subject M1 --count 10 --threshold 0.9

Requiere: ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Any

import anthropic
import requests
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Constantes
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
TEMARIO_CSV = BASE_DIR / "content" / "temario_paes.csv"
OUTPUT_DIR = Path(__file__).resolve().parent / "output"

BATCH_SIZE = 5  # Preguntas por llamada a Claude
CLAUDE_MODEL = "claude-sonnet-4-20250514"
CONFIDENCE_THRESHOLD = 0.8

# Número de opciones por asignatura
OPTIONS_COUNT: dict[str, int] = {
    "M1": 4, "M2": 5, "L": 5, "H": 5,
    "CB": 4, "CF": 4, "CQ": 4,
}

# Subject → sub-subjects para ciencias
SCIENCE_SUBJECTS: dict[str, str] = {
    "Biologia": "CB",
    "Fisica": "CF",
    "Quimica": "CQ",
}

ALL_SUBJECTS = ["M1", "M2", "L", "H", "CB", "CF", "CQ"]

SUBJECT_NAMES: dict[str, str] = {
    "M1": "Matemática 1", "M2": "Matemática 2",
    "L": "Lenguaje y Comunicación", "H": "Historia y Ciencias Sociales",
    "CB": "Ciencias - Biología", "CF": "Ciencias - Física", "CQ": "Ciencias - Química",
}

# Habilidades por tipo de asignatura
HABILIDADES: dict[str, list[str]] = {
    "M1": ["Resolver problemas", "Modelar", "Representar", "Argumentar y comunicar"],
    "M2": ["Resolver problemas", "Modelar", "Representar", "Argumentar y comunicar"],
    "CB": ["Resolver problemas", "Modelar", "Representar", "Argumentar y comunicar"],
    "CF": ["Resolver problemas", "Modelar", "Representar", "Argumentar y comunicar"],
    "CQ": ["Resolver problemas", "Modelar", "Representar", "Argumentar y comunicar"],
    "H": ["Evaluar", "Interpretar", "Localizar"],
    "L": ["Evaluar", "Interpretar", "Localizar"],
}

REQUIRED_ENV = ("ANTHROPIC_API_KEY", "SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_KEY")


# ---------------------------------------------------------------------------
# Paso 1: Cargar temario
# ---------------------------------------------------------------------------
def load_temario() -> dict[str, list[dict[str, str]]]:
    """Lee temario CSV y retorna {subject_code: [{area, tema, subtema}, ...]}."""
    if not TEMARIO_CSV.exists():
        print(f"No se encontró {TEMARIO_CSV}", file=sys.stderr)
        sys.exit(1)

    entries: dict[str, list[dict[str, str]]] = {}
    with TEMARIO_CSV.open(encoding="utf-8") as f:
        lines = [line.strip() for line in f if line.strip()]

    for line in lines[1:]:  # skip header
        parts = [p.strip() for p in line.split(";")]
        if len(parts) < 4 or not parts[0] or not parts[1]:
            continue

        raw_subject, area, tema, subtema = parts[0], parts[1], parts[2], parts[3]

        # Ciencias: subject=C, area=Biologia → code=CB
        if raw_subject == "C":
            code = SCIENCE_SUBJECTS.get(area)
            if not code:
                continue
        else:
            code = raw_subject

        if code not in entries:
            entries[code] = []
        entries[code].append({
            "area_tematica": area,
            "tema": tema,
            "subtema": subtema,
        })

    print(f"Temario cargado: {', '.join(f'{k}({len(v)})' for k, v in sorted(entries.items()))}")
    return entries


# ---------------------------------------------------------------------------
# Paso 2: Distribuir temas
# ---------------------------------------------------------------------------
def distribute_topics(temario_entries: list[dict[str, str]], count: int) -> list[dict[str, str]]:
    """Distribuye count preguntas proporcionalmente entre los temas del temario."""
    if not temario_entries:
        return []
    result = []
    idx = 0
    for _ in range(count):
        result.append(temario_entries[idx % len(temario_entries)])
        idx += 1
    return result


# ---------------------------------------------------------------------------
# Paso 3: Generar preguntas con Claude
# ---------------------------------------------------------------------------
def build_generation_prompt(
    subject: str,
    topics: list[dict[str, str]],
    num_options: int,
) -> str:
    """Construye el prompt de generación para un lote de preguntas."""
    subject_name = SUBJECT_NAMES[subject]
    option_labels = ", ".join(chr(97 + i) for i in range(num_options))
    habilidades = ", ".join(HABILIDADES[subject])

    topics_desc = "\n".join(
        f"  {i+1}. Área: {t['area_tematica']} | Tema: {t['tema']} | Subtema: {t['subtema']}"
        for i, t in enumerate(topics)
    )

    options_example = "\n".join(
        f'      "{chr(97 + i)}": "Texto de la opción {chr(65 + i)}."'
        for i in range(num_options)
    )

    return f"""Eres un experto diseñador de ítems para la Prueba de Acceso a la Educación Superior (PAES) de Chile, asignatura {subject_name}.

Genera exactamente {len(topics)} preguntas de selección múltiple, una para cada tema indicado:

{topics_desc}

REGLAS ESTRICTAS:
1. Cada pregunta debe tener exactamente {num_options} opciones ({option_labels}).
2. Solo UNA opción es correcta. Las demás deben ser plausibles pero incorrectas.
3. NUNCA uses "Todas las anteriores", "Ninguna de las anteriores" ni opciones triviales.
4. La explicación debe detallar POR QUÉ la correcta es correcta y POR QUÉ cada incorrecta falla.
5. Asigna dificultad (1-5): 1=conocimiento básico, 2=aplicación directa, 3=análisis, 4=evaluación compleja, 5=síntesis original.
6. Asigna una habilidad de: {habilidades}.
7. Las preguntas deben ser originales, no copias de exámenes existentes.
8. Usa lenguaje formal académico apropiado para estudiantes de enseñanza media chilena.

Responde SOLAMENTE con un JSON válido (sin markdown, sin ```), un arreglo de objetos:
[
  {{
    "content": "Enunciado completo de la pregunta.",
    "options": {{
{options_example}
    }},
    "correct_answer": "{chr(97)}",
    "explanation": "Explicación detallada.",
    "area_tematica": "Área del temario",
    "tema": "Tema específico",
    "subtema": "Subtema",
    "difficulty": 3,
    "habilidad": "Habilidad evaluada"
  }}
]"""


def generate_batch(
    client: anthropic.Anthropic,
    subject: str,
    topics: list[dict[str, str]],
    num_options: int,
) -> list[dict[str, Any]]:
    """Genera un lote de preguntas con Claude."""
    prompt = build_generation_prompt(subject, topics, num_options)

    try:
        response = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=4096,
            temperature=0.4,
            messages=[{"role": "user", "content": prompt}],
        )
        text = response.content[0].text.strip()

        # Limpiar posible markdown wrapper
        if text.startswith("```"):
            text = text.split("```", 2)[1]
            if text.startswith("json"):
                text = text[4:]
            text = text.rsplit("```", 1)[0].strip()

        return json.loads(text)
    except (json.JSONDecodeError, IndexError, anthropic.APIError) as e:
        print(f"  Error generando lote: {e}", file=sys.stderr)
        return []


# ---------------------------------------------------------------------------
# Paso 4: Validar formato
# ---------------------------------------------------------------------------
def validate_question(q: dict[str, Any], subject: str, num_options: int) -> bool:
    """Valida que una pregunta tenga el formato correcto."""
    if not isinstance(q.get("content"), str) or len(q["content"]) < 20:
        return False
    if not isinstance(q.get("options"), dict):
        return False
    expected_keys = {chr(97 + i) for i in range(num_options)}
    if set(q["options"].keys()) != expected_keys:
        return False
    if q.get("correct_answer") not in expected_keys:
        return False
    if not isinstance(q.get("explanation"), str) or len(q["explanation"]) < 20:
        return False
    diff = q.get("difficulty")
    if not isinstance(diff, int) or diff < 1 or diff > 5:
        # Intentar convertir
        try:
            q["difficulty"] = max(1, min(5, int(diff)))
        except (TypeError, ValueError):
            return False
    return True


# ---------------------------------------------------------------------------
# Paso 5: Auto-verificación con Claude
# ---------------------------------------------------------------------------
def build_verification_prompt(question: dict[str, Any], subject: str) -> str:
    """Construye prompt para verificar la corrección de una pregunta."""
    options_text = "\n".join(
        f"  {k}) {v}" for k, v in sorted(question["options"].items())
    )
    return f"""Eres un verificador experto de preguntas PAES ({SUBJECT_NAMES[subject]}).

Analiza esta pregunta y determina si es correcta:

PREGUNTA: {question['content']}

OPCIONES:
{options_text}

RESPUESTA MARCADA COMO CORRECTA: {question['correct_answer']})

EXPLICACIÓN PROPORCIONADA: {question['explanation']}

Verifica:
1. ¿La respuesta marcada como correcta es REALMENTE correcta?
2. ¿Las demás opciones son REALMENTE incorrectas?
3. ¿La explicación es precisa y sin errores?
4. ¿La pregunta tiene sentido y es clara?

Responde SOLAMENTE con un JSON (sin markdown):
{{
  "is_correct": true/false,
  "confidence": 0.0-1.0,
  "issues": "Descripción de problemas encontrados o 'Ninguno'"
}}"""


def verify_question(
    client: anthropic.Anthropic,
    question: dict[str, Any],
    subject: str,
) -> dict[str, Any]:
    """Verifica una pregunta con Claude. Retorna {is_correct, confidence, issues}."""
    prompt = build_verification_prompt(question, subject)

    try:
        response = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=512,
            temperature=0.0,
            messages=[{"role": "user", "content": prompt}],
        )
        text = response.content[0].text.strip()

        if text.startswith("```"):
            text = text.split("```", 2)[1]
            if text.startswith("json"):
                text = text[4:]
            text = text.rsplit("```", 1)[0].strip()

        result = json.loads(text)
        return {
            "is_correct": bool(result.get("is_correct", False)),
            "confidence": float(result.get("confidence", 0.0)),
            "issues": str(result.get("issues", "")),
        }
    except (json.JSONDecodeError, anthropic.APIError, KeyError) as e:
        print(f"  Error verificando pregunta: {e}", file=sys.stderr)
        return {"is_correct": False, "confidence": 0.0, "issues": f"Error de verificación: {e}"}


# ---------------------------------------------------------------------------
# Paso 6: Insertar en Supabase
# ---------------------------------------------------------------------------
def insert_question(
    env: dict[str, str],
    question: dict[str, Any],
    subject: str,
    confidence: float,
    threshold: float,
    verification: dict[str, Any],
) -> bool:
    """Inserta una pregunta en Supabase. Retorna True si fue exitoso."""
    base_url = env["SUPABASE_URL"].rstrip("/")
    endpoint = f"{base_url}/rest/v1/questions"
    headers = {
        "apikey": env["SUPABASE_ANON_KEY"],
        "Authorization": f"Bearer {env['SUPABASE_SERVICE_KEY']}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    is_active = confidence >= threshold and verification.get("is_correct", False)

    payload = {
        "subject": subject,
        "content": question["content"],
        "options": question["options"],
        "correct_answer": question["correct_answer"],
        "explanation": question["explanation"],
        "area_tematica": question.get("area_tematica", ""),
        "tema": question.get("tema", ""),
        "subtema": question.get("subtema", ""),
        "difficulty": question.get("difficulty", 3),
        "habilidad": question.get("habilidad", ""),
        "active": is_active,
        "review_status": "approved" if is_active else "pending",
        "classification_confidence": confidence,
        "ai_classification": json.dumps(verification),
        "origen": "ai-generated-claude",
        "metadata": json.dumps({
            "model": CLAUDE_MODEL,
            "generated_at": datetime.now().isoformat(),
            "verification_confidence": confidence,
            "verification_issues": verification.get("issues", ""),
        }),
    }

    resp = requests.post(endpoint, headers=headers, data=json.dumps(payload))
    if not resp.ok:
        print(f"  Error HTTP {resp.status_code}: {resp.text[:200]}", file=sys.stderr)
        return False
    return True


# ---------------------------------------------------------------------------
# Pipeline principal
# ---------------------------------------------------------------------------
def run_pipeline(
    subjects: list[str],
    count_per_subject: int,
    threshold: float,
    dry_run: bool,
) -> None:
    load_dotenv()

    # Verificar env
    if not dry_run:
        missing = [k for k in REQUIRED_ENV if not os.getenv(k)]
        if missing:
            print(f"Faltan variables de entorno: {', '.join(missing)}", file=sys.stderr)
            sys.exit(1)
    else:
        if not os.getenv("ANTHROPIC_API_KEY"):
            print("Falta ANTHROPIC_API_KEY", file=sys.stderr)
            sys.exit(1)

    env = {k: os.getenv(k, "") for k in REQUIRED_ENV}
    client = anthropic.Anthropic(api_key=env["ANTHROPIC_API_KEY"])
    temario = load_temario()

    # Estadísticas globales
    stats = {"generated": 0, "valid": 0, "verified_ok": 0, "inserted": 0, "active": 0, "pending": 0}
    all_questions: list[dict[str, Any]] = []

    for subject in subjects:
        if subject not in temario:
            print(f"No hay temario para {subject}, saltando.", file=sys.stderr)
            continue

        num_options = OPTIONS_COUNT[subject]
        topics_pool = temario[subject]
        distributed = distribute_topics(topics_pool, count_per_subject)

        print(f"\n{'='*70}")
        print(f"  {SUBJECT_NAMES[subject]} ({subject}) — {count_per_subject} preguntas, {num_options} opciones")
        print(f"{'='*70}")

        # Generar en lotes
        generated = []
        for batch_start in range(0, len(distributed), BATCH_SIZE):
            batch_topics = distributed[batch_start:batch_start + BATCH_SIZE]
            batch_num = batch_start // BATCH_SIZE + 1
            total_batches = (len(distributed) + BATCH_SIZE - 1) // BATCH_SIZE
            print(f"\n  Lote {batch_num}/{total_batches}: generando {len(batch_topics)} preguntas...")

            raw = generate_batch(client, subject, batch_topics, num_options)
            stats["generated"] += len(raw)

            # Validar
            for q in raw:
                if validate_question(q, subject, num_options):
                    generated.append(q)
                    stats["valid"] += 1
                else:
                    print(f"    Pregunta descartada (formato inválido)")

            time.sleep(1)  # Rate limiting entre lotes

        # Verificar y (opcionalmente) insertar
        for i, q in enumerate(generated, 1):
            print(f"  Verificando {i}/{len(generated)}...", end=" ")
            verification = verify_question(client, q, subject)
            confidence = verification["confidence"]
            is_ok = verification["is_correct"]

            status_emoji = "✓" if is_ok and confidence >= threshold else "⚠" if is_ok else "✗"
            print(f"{status_emoji} confidence={confidence:.2f}" +
                  (f" issues={verification['issues']}" if verification["issues"] != "Ninguno" else ""))

            if is_ok:
                stats["verified_ok"] += 1

            q["_verification"] = verification
            q["_confidence"] = confidence
            q["_subject"] = subject
            q["_active"] = is_ok and confidence >= threshold

            if q["_active"]:
                stats["active"] += 1
            else:
                stats["pending"] += 1

            if not dry_run:
                if insert_question(env, q, subject, confidence, threshold, verification):
                    stats["inserted"] += 1
                    print(f"    → Insertada ({'active' if q['_active'] else 'pending'})")
                else:
                    print(f"    → Error al insertar")
                time.sleep(0.1)

            all_questions.append(q)
            time.sleep(0.5)  # Rate limiting verificación

    # Paso 7: Reporte y backup
    print(f"\n{'='*70}")
    print(f"  RESUMEN")
    print(f"{'='*70}")
    print(f"  Generadas:     {stats['generated']}")
    print(f"  Válidas:       {stats['valid']}")
    print(f"  Verificadas OK:{stats['verified_ok']}")
    if not dry_run:
        print(f"  Insertadas:    {stats['inserted']}")
    print(f"  Activas:       {stats['active']}  (confidence >= {threshold})")
    print(f"  Pendientes:    {stats['pending']} (requieren revisión)")
    print(f"{'='*70}")

    # Guardar backup JSON
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    subjects_str = "-".join(subjects)
    backup_path = OUTPUT_DIR / f"generated_{subjects_str}_{timestamp}.json"

    # Limpiar campos internos para el backup
    backup_data = []
    for q in all_questions:
        clean = {k: v for k, v in q.items() if not k.startswith("_")}
        clean["_meta"] = {
            "subject": q.get("_subject"),
            "confidence": q.get("_confidence"),
            "active": q.get("_active"),
            "verification": q.get("_verification"),
        }
        backup_data.append(clean)

    with backup_path.open("w", encoding="utf-8") as f:
        json.dump(backup_data, f, ensure_ascii=False, indent=2)
    print(f"\n  Backup guardado en: {backup_path}")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def main() -> None:
    parser = argparse.ArgumentParser(
        description="Pipeline de generación de preguntas PAES con Claude"
    )
    parser.add_argument(
        "--subject", required=True,
        help="Asignatura: M1, M2, L, H, CB, CF, CQ, o ALL",
    )
    parser.add_argument(
        "--count", type=int, default=20,
        help="Número de preguntas por asignatura (default: 20)",
    )
    parser.add_argument(
        "--threshold", type=float, default=CONFIDENCE_THRESHOLD,
        help=f"Umbral de confianza para activación automática (default: {CONFIDENCE_THRESHOLD})",
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Generar y verificar sin insertar en Supabase",
    )
    args = parser.parse_args()

    if args.subject == "ALL":
        subjects = ALL_SUBJECTS
    else:
        subjects = [s.strip() for s in args.subject.split(",")]
        for s in subjects:
            if s not in ALL_SUBJECTS:
                print(f"Asignatura no válida: {s}. Opciones: {', '.join(ALL_SUBJECTS)}, ALL", file=sys.stderr)
                sys.exit(1)

    print(f"Pipeline PAES Question Generator")
    print(f"  Modelo: {CLAUDE_MODEL}")
    print(f"  Asignaturas: {', '.join(subjects)}")
    print(f"  Preguntas por asignatura: {args.count}")
    print(f"  Umbral de confianza: {args.threshold}")
    print(f"  Modo: {'DRY-RUN (sin inserción)' if args.dry_run else 'PRODUCCIÓN'}")

    run_pipeline(subjects, args.count, args.threshold, args.dry_run)


if __name__ == "__main__":
    main()
