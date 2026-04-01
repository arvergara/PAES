#!/usr/bin/env python3
"""Revisor interactivo de preguntas PAES generadas.

Uso:
    python scripts/review_questions.py scripts/output/generated_CB_test_taxonomy.json
    python scripts/review_questions.py scripts/output/generated_L_dryrun.json
"""
import json
import sys
from pathlib import Path

COLORS = {
    "green": "\033[92m",
    "red": "\033[91m",
    "yellow": "\033[93m",
    "blue": "\033[94m",
    "cyan": "\033[96m",
    "bold": "\033[1m",
    "dim": "\033[2m",
    "reset": "\033[0m",
}


def c(text, color):
    return f"{COLORS[color]}{text}{COLORS['reset']}"


def print_separator():
    print(c("─" * 70, "dim"))


def print_question(q, num, total, reading_title=None):
    print(f"\n{'=' * 70}")
    print(c(f"  Pregunta {num}/{total}", "bold"))
    if reading_title:
        print(c(f"  Texto: \"{reading_title}\"", "cyan"))
    print(f"  {c('Área:', 'dim')} {q.get('area_tematica', '?')} → {q.get('tema', '?')} → {q.get('subtema', '?')}")
    print(f"  {c('Dificultad:', 'dim')} {'★' * q.get('difficulty', 0)}{'☆' * (5 - q.get('difficulty', 0))} ({q.get('difficulty', '?')}/5)  {c('Habilidad:', 'dim')} {q.get('habilidad', '?')}")
    meta = q.get("_meta", {})
    conf = meta.get("confidence", 0)
    conf_color = "green" if conf >= 0.9 else "yellow" if conf >= 0.8 else "red"
    print(f"  {c('Confianza:', 'dim')} {c(f'{conf:.0%}', conf_color)}  {c('Issues:', 'dim')} {meta.get('issues', '?')}")
    print_separator()

    # Content (may be long for Historia with embedded sources)
    content = q["content"]
    # Wrap long lines
    lines = content.split("\n")
    for line in lines:
        while len(line) > 68:
            split_at = line[:68].rfind(" ")
            if split_at == -1:
                split_at = 68
            print(f"  {line[:split_at]}")
            line = line[split_at:].lstrip()
        print(f"  {line}")

    print_separator()

    # Options
    options = q.get("options", {})
    correct = q.get("correct_answer", "")
    for key in sorted(options.keys()):
        text = options[key]
        print(f"    {c(key.upper() + ')', 'bold')} {text}")

    return correct, q.get("explanation", "")


def print_reading_text(rt):
    print(f"\n{'=' * 70}")
    print(c(f"  TEXTO DE LECTURA", "bold"))
    print(f"  {c('Título:', 'dim')} {rt.get('title', '?')}")
    print(f"  {c('Fuente:', 'dim')} {rt.get('source', '?')}")
    print_separator()
    content = rt.get("content", "")
    paragraphs = content.split("\n")
    for p in paragraphs:
        while len(p) > 66:
            split_at = p[:66].rfind(" ")
            if split_at == -1:
                split_at = 66
            print(f"  {p[:split_at]}")
            p = p[split_at:].lstrip()
        print(f"  {p}")
    print(f"{'=' * 70}")


def reveal_answer(correct, explanation):
    print(f"\n  {c('Respuesta correcta:', 'bold')} {c(correct.upper(), 'green')}")
    print()
    # Wrap explanation
    words = explanation.split()
    line = "  "
    for w in words:
        if len(line) + len(w) + 1 > 68:
            print(line)
            line = "  " + w
        else:
            line += " " + w if line.strip() else "  " + w
    if line.strip():
        print(line)


def main():
    if len(sys.argv) < 2:
        print("Uso: python scripts/review_questions.py <archivo.json>")
        print("\nArchivos disponibles:")
        output_dir = Path("scripts/output")
        if output_dir.exists():
            for f in sorted(output_dir.glob("generated_*.json")):
                size = f.stat().st_size
                with f.open() as fh:
                    data = json.load(fh)
                if isinstance(data, list) and data and "reading_text" in data[0]:
                    n = sum(len(g.get("questions", [])) for g in data)
                    print(f"  {f}  ({len(data)} textos, {n} preguntas)")
                else:
                    print(f"  {f}  ({len(data)} preguntas)")
        sys.exit(1)

    json_path = Path(sys.argv[1])
    if not json_path.exists():
        print(f"No se encontró {json_path}")
        sys.exit(1)

    with json_path.open(encoding="utf-8") as f:
        data = json.load(f)

    # Detect format
    is_lenguaje = isinstance(data, list) and data and isinstance(data[0], dict) and "reading_text" in data[0]

    if is_lenguaje:
        all_questions = []
        for group in data:
            rt = group.get("reading_text", {})
            for q in group.get("questions", []):
                all_questions.append((q, rt))
        total = len(all_questions)
        total_texts = len(data)
        print(c(f"\n  Revisando {total} preguntas de Lenguaje ({total_texts} textos)", "bold"))
        print(c(f"  Archivo: {json_path}", "dim"))
    else:
        all_questions = [(q, None) for q in data]
        total = len(all_questions)
        print(c(f"\n  Revisando {total} preguntas", "bold"))
        print(c(f"  Archivo: {json_path}", "dim"))

    stats = {"good": 0, "bad": 0, "skip": 0}
    current_reading = None
    idx = 0

    while idx < total:
        q, rt = all_questions[idx]

        # Show reading text if it changed (Lenguaje)
        if rt and rt != current_reading:
            current_reading = rt
            print_reading_text(rt)
            input(c("\n  [Enter para ver las preguntas de este texto]", "dim"))

        correct, explanation = print_question(q, idx + 1, total, rt.get("title") if rt else None)

        print(f"\n  {c('[Enter]', 'dim')} ver respuesta  {c('[s]', 'dim')} saltar  {c('[q]', 'dim')} salir")
        action = input("  > ").strip().lower()

        if action == "q":
            break
        elif action == "s":
            stats["skip"] += 1
            idx += 1
            continue

        reveal_answer(correct, explanation)

        print(f"\n  ¿Pregunta correcta? {c('[Enter/s]', 'green')} sí  {c('[n]', 'red')} no  {c('[q]', 'dim')} salir")
        verdict = input("  > ").strip().lower()

        if verdict == "q":
            break
        elif verdict == "n":
            stats["bad"] += 1
        else:
            stats["good"] += 1

        idx += 1

    # Summary
    reviewed = stats["good"] + stats["bad"]
    print(f"\n{'=' * 70}")
    print(c("  RESUMEN DE REVISIÓN", "bold"))
    print_separator()
    print(f"  Revisadas:  {reviewed}/{total}")
    if reviewed > 0:
        print(f"  {c('Correctas:', 'green')}  {stats['good']} ({stats['good']/reviewed:.0%})")
        print(f"  {c('Con error:', 'red')}   {stats['bad']} ({stats['bad']/reviewed:.0%})")
    if stats["skip"]:
        print(f"  {c('Saltadas:', 'yellow')}   {stats['skip']}")
    remaining = total - reviewed - stats["skip"]
    if remaining > 0:
        print(f"  {c('Pendientes:', 'dim')}  {remaining}")
    print(f"{'=' * 70}\n")


if __name__ == "__main__":
    main()
