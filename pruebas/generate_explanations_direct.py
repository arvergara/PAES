#!/usr/bin/env python3
"""
Script to generate detailed, specific explanations for Chilean History PAES questions.
This script reads questions and outputs them for Claude to process in batches.
"""

import json
from typing import Dict, List, Any, Tuple

QUESTION_BANK_PATH = "/Users/alfil/Library/CloudStorage/GoogleDrive-andres.vergara@maindset.cl/Mi unidad/5_PAES/Nuevo_PAES/pruebas/h_question_bank.json"

def load_question_bank() -> Dict[str, Any]:
    """Load the question bank from JSON file."""
    with open(QUESTION_BANK_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def needs_explanation(question: Dict[str, Any]) -> bool:
    """Check if a question needs a new explanation."""
    explanation = question.get('explicacion', '')
    return 'clavijero oficial PAES' in explanation or len(explanation) < 50

def analyze_questions() -> Tuple[int, int, List[Dict[str, Any]]]:
    """Analyze the question bank and return statistics."""
    data = load_question_bank()
    questions = data.get('preguntas', [])
    total = len(questions)

    needs_update = []
    for q in questions:
        if needs_explanation(q):
            needs_update.append(q)

    return total, len(needs_update), needs_update

def export_questions_for_processing(output_file: str, limit: int = None) -> None:
    """Export questions that need explanations to a file for processing."""
    data = load_question_bank()
    questions = data.get('preguntas', [])

    questions_to_process = []
    for q in questions:
        if needs_explanation(q):
            # Extract essential info
            questions_to_process.append({
                'id': q.get('id'),
                'texto': q.get('texto'),
                'alternativas': q.get('alternativas'),
                'correcta': q.get('correcta'),
                'area_tematica': q.get('area_tematica'),
                'tema': q.get('tema'),
                'subtema': q.get('subtema'),
                'explicacion_actual': q.get('explicacion', '')
            })

            if limit and len(questions_to_process) >= limit:
                break

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(questions_to_process, f, ensure_ascii=False, indent=2)

    print(f"Exported {len(questions_to_process)} questions to {output_file}")

def import_explanations(input_file: str) -> int:
    """Import generated explanations back into the question bank."""
    # Load generated explanations
    with open(input_file, 'r', encoding='utf-8') as f:
        generated = json.load(f)

    # Create a map of id -> explanation
    explanation_map = {}
    for item in generated:
        if 'id' in item and 'explicacion' in item:
            explanation_map[item['id']] = item['explicacion']

    # Load question bank
    data = load_question_bank()
    questions = data.get('preguntas', [])

    # Update explanations
    updated_count = 0
    for q in questions:
        q_id = q.get('id')
        if q_id in explanation_map:
            q['explicacion'] = explanation_map[q_id]
            updated_count += 1

    # Save updated question bank
    with open(QUESTION_BANK_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Updated {updated_count} explanations in question bank")
    return updated_count

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage:")
        print("  python generate_explanations_direct.py analyze")
        print("  python generate_explanations_direct.py export <output_file> [limit]")
        print("  python generate_explanations_direct.py import <input_file>")
        sys.exit(1)

    command = sys.argv[1]

    if command == "analyze":
        total, needs_update, _ = analyze_questions()
        print(f"Total questions: {total}")
        print(f"Need explanations: {needs_update}")
        print(f"Already have explanations: {total - needs_update}")

    elif command == "export":
        if len(sys.argv) < 3:
            print("Error: output file required")
            sys.exit(1)
        output_file = sys.argv[2]
        limit = int(sys.argv[3]) if len(sys.argv) > 3 else None
        export_questions_for_processing(output_file, limit)

    elif command == "import":
        if len(sys.argv) < 3:
            print("Error: input file required")
            sys.exit(1)
        input_file = sys.argv[2]
        import_explanations(input_file)

    else:
        print(f"Unknown command: {command}")
        sys.exit(1)
