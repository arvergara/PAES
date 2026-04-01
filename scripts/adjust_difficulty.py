#!/usr/bin/env python3
"""Ajusta la dificultad de preguntas basándose en la tasa de acierto real.

Lee las estadísticas de question_attempts y actualiza el campo difficulty
de las preguntas que tienen suficientes datos (mínimo N intentos).

Uso:
    python3 scripts/adjust_difficulty.py                 # Dry-run (solo muestra cambios)
    python3 scripts/adjust_difficulty.py --apply         # Aplica los cambios
    python3 scripts/adjust_difficulty.py --min-attempts 10  # Mínimo 10 intentos para ajustar
    python3 scripts/adjust_difficulty.py --origin ai-generated  # Solo ajustar AI questions
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime

import requests
from dotenv import load_dotenv

REQUIRED_ENV = ("SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_KEY")
DEFAULT_MIN_ATTEMPTS = 5

# Mapeo: tasa de acierto → dificultad sugerida
# Calibrado según distribución PAES real
DIFFICULTY_THRESHOLDS = [
    (0.80, 1),  # ≥80% acierto → Muy fácil
    (0.65, 2),  # 65-80% → Fácil
    (0.50, 3),  # 50-65% → Media
    (0.35, 4),  # 35-50% → Difícil
    (0.00, 5),  # <35% → Muy difícil
]


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
    }


def base_url(env: dict[str, str]) -> str:
    return env["SUPABASE_URL"].rstrip("/")


def suggest_difficulty(success_rate: float) -> int:
    for threshold, diff in DIFFICULTY_THRESHOLDS:
        if success_rate >= threshold:
            return diff
    return 5


def fetch_question_stats(env: dict[str, str], min_attempts: int, origin_filter: str | None) -> list[dict]:
    """Obtiene estadísticas de preguntas desde question_attempts via SQL."""
    # Usamos la API REST para hacer la consulta aggregada
    # Primero obtenemos los attempts agrupados por question_id
    endpoint = f"{base_url(env)}/rest/v1/rpc/get_question_stats"

    # Alternativa: usar la vista question_stats si existe
    endpoint = f"{base_url(env)}/rest/v1/question_stats"
    params = {
        "select": "question_id,subject,area_tematica,tema,difficulty,origen,total_attempts,correct_attempts,success_rate,suggested_difficulty",
        f"total_attempts": f"gte.{min_attempts}",
    }
    if origin_filter:
        params["origen"] = f"eq.{origin_filter}"

    headers = api_headers(env)
    resp = requests.get(endpoint, headers=headers, params=params)

    if resp.status_code == 404 or (resp.status_code == 400 and "relation" in resp.text.lower()):
        print("La vista question_stats no existe. Ejecuta primero la migración:")
        print("  supabase/migrations/20260217_question_metrics.sql")
        print("\nO calcula manualmente con question_attempts...")
        return fetch_stats_manual(env, min_attempts, origin_filter)

    if not resp.ok:
        print(f"Error HTTP {resp.status_code}: {resp.text[:200]}", file=sys.stderr)
        sys.exit(1)

    return resp.json()


def fetch_stats_manual(env: dict[str, str], min_attempts: int, origin_filter: str | None) -> list[dict]:
    """Calcula stats manualmente si la vista no existe."""
    # Obtener todos los attempts
    endpoint = f"{base_url(env)}/rest/v1/question_attempts"
    headers = api_headers(env)
    params = {"select": "question_id,is_correct"}
    resp = requests.get(endpoint, headers=headers, params=params)
    if not resp.ok:
        print(f"Error obteniendo attempts: {resp.status_code}", file=sys.stderr)
        return []

    attempts = resp.json()

    # Agrupar por question_id
    from collections import Counter, defaultdict
    stats = defaultdict(lambda: {"total": 0, "correct": 0})
    for a in attempts:
        qid = a["question_id"]
        stats[qid]["total"] += 1
        if a["is_correct"]:
            stats[qid]["correct"] += 1

    # Filtrar por min_attempts
    question_ids = [qid for qid, s in stats.items() if s["total"] >= min_attempts]
    if not question_ids:
        return []

    # Obtener datos de las preguntas
    results = []
    for qid in question_ids:
        s = stats[qid]
        rate = s["correct"] / s["total"] if s["total"] > 0 else 0
        # Obtener question info
        q_endpoint = f"{base_url(env)}/rest/v1/questions"
        q_params = {
            "select": "id,subject,area_tematica,tema,difficulty,origen",
            "id": f"eq.{qid}",
        }
        q_resp = requests.get(q_endpoint, headers=headers, params=q_params)
        if q_resp.ok and q_resp.json():
            q_data = q_resp.json()[0]
            if origin_filter and q_data.get("origen") != origin_filter:
                continue
            results.append({
                "question_id": qid,
                "subject": q_data["subject"],
                "area_tematica": q_data.get("area_tematica"),
                "tema": q_data.get("tema"),
                "difficulty": q_data["difficulty"],
                "origen": q_data.get("origen"),
                "total_attempts": s["total"],
                "correct_attempts": s["correct"],
                "success_rate": round(rate, 3),
                "suggested_difficulty": suggest_difficulty(rate),
            })

    return results


def update_difficulty(env: dict[str, str], question_id: str, new_difficulty: int) -> bool:
    endpoint = f"{base_url(env)}/rest/v1/questions"
    headers = api_headers(env)
    headers["Prefer"] = "return=minimal"
    params = {"id": f"eq.{question_id}"}
    payload = {"difficulty": new_difficulty}

    resp = requests.patch(endpoint, headers=headers, params=params, data=json.dumps(payload))
    return resp.ok


def main():
    parser = argparse.ArgumentParser(description="Ajustar dificultad basado en tasa de acierto real")
    parser.add_argument("--apply", action="store_true", help="Aplicar cambios (sin esto es dry-run)")
    parser.add_argument("--min-attempts", type=int, default=DEFAULT_MIN_ATTEMPTS,
                        help=f"Mínimo de intentos para ajustar (default: {DEFAULT_MIN_ATTEMPTS})")
    parser.add_argument("--origin", type=str, default=None,
                        help="Filtrar por origen (ej: ai-generated, demre-oficial)")
    args = parser.parse_args()

    env = ensure_env()
    mode = "APLICANDO" if args.apply else "DRY-RUN"

    print(f"\n{'=' * 60}")
    print(f"  Ajuste de dificultad ({mode})")
    print(f"  Mínimo intentos: {args.min_attempts}")
    if args.origin:
        print(f"  Filtro origen: {args.origin}")
    print(f"{'=' * 60}\n")

    stats = fetch_question_stats(env, args.min_attempts, args.origin)

    if not stats:
        print("No hay preguntas con suficientes intentos para ajustar.")
        return

    changes = []
    for q in stats:
        current = q["difficulty"]
        suggested = q.get("suggested_difficulty")
        if suggested is None:
            suggested = suggest_difficulty(q["success_rate"])
        if current != suggested:
            changes.append(q | {"new_difficulty": suggested})

    if not changes:
        print(f"Se analizaron {len(stats)} preguntas. Ninguna necesita ajuste.")
        return

    print(f"Se analizaron {len(stats)} preguntas. {len(changes)} necesitan ajuste:\n")
    print(f"  {'Subject':<6} {'Origen':<20} {'Tasa':<8} {'Actual':<8} {'→ Nueva':<8} {'Tema'}")
    print(f"  {'─' * 6} {'─' * 20} {'─' * 8} {'─' * 8} {'─' * 8} {'─' * 30}")

    for ch in sorted(changes, key=lambda x: (x["subject"], x["success_rate"])):
        rate_str = f"{ch['success_rate']:.0%}"
        tema_short = (ch.get("tema") or "")[:30]
        print(f"  {ch['subject']:<6} {(ch.get('origen') or '?'):<20} {rate_str:<8} {ch['difficulty']:<8} → {ch['new_difficulty']:<6} {tema_short}")

    if args.apply:
        print(f"\nAplicando {len(changes)} cambios...")
        applied = 0
        errors = 0
        for ch in changes:
            if update_difficulty(env, ch["question_id"], ch["new_difficulty"]):
                applied += 1
            else:
                errors += 1

        print(f"\nResultado: {applied} actualizadas, {errors} errores")
    else:
        print(f"\n  (Modo dry-run. Usa --apply para aplicar cambios)")

    # Resumen por origen
    print(f"\n{'─' * 60}")
    print("  Resumen por origen:")
    from collections import Counter
    by_origin = Counter(ch.get("origen", "?") for ch in changes)
    for origin, count in by_origin.most_common():
        print(f"    {origin}: {count} ajustes")


if __name__ == "__main__":
    main()
