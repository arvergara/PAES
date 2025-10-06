#!/usr/bin/env python3
"""
Enhanced explanation generator - processes questions in batches for AI analysis
"""

import json
import sys

QUESTION_BANK_PATH = "/Users/alfil/Library/CloudStorage/GoogleDrive-andres.vergara@maindset.cl/Mi unidad/5_PAES/Nuevo_PAES/pruebas/h_question_bank.json"

def load_questions():
    """Load all questions from the question bank."""
    with open(QUESTION_BANK_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data

def needs_better_explanation(question):
    """Check if explanation is too generic."""
    explanation = question.get('explicacion', '')

    # Generic phrases that indicate need for improvement
    generic_phrases = [
        'corresponde al análisis histórico del período',
        'refleja la dinámica económica descrita',
        'se ajusta a los principios de formación ciudadana',
        'según el análisis del contenido histórico'
    ]

    return any(phrase in explanation for phrase in generic_phrases)

def export_questions_for_ai(batch_num, batch_size=20):
    """Export a batch of questions that need better explanations."""
    data = load_questions()
    questions = data['preguntas']

    questions_needing_improvement = []
    for q in questions:
        if needs_better_explanation(q):
            questions_needing_improvement.append(q)

    # Get the batch
    start_idx = (batch_num - 1) * batch_size
    end_idx = min(start_idx + batch_size, len(questions_needing_improvement))
    batch = questions_needing_improvement[start_idx:end_idx]

    # Export to file
    output_file = f"/Users/alfil/Library/CloudStorage/GoogleDrive-andres.vergara@maindset.cl/Mi unidad/5_PAES/Nuevo_PAES/pruebas/batch_{batch_num}.json"

    batch_data = []
    for q in batch:
        correct_idx = ord(q.get('correcta', 'A')) - ord('A')
        correct_text = q['alternativas'][correct_idx] if correct_idx < len(q['alternativas']) else ''

        batch_data.append({
            'id': q['id'],
            'texto': q['texto'],
            'alternativas': q['alternativas'],
            'correcta': q['correcta'],
            'respuesta_correcta': correct_text,
            'area_tematica': q['area_tematica'],
            'tema': q.get('tema', 'Unknown'),
            'subtema': q.get('subtema', 'Unknown'),
            'explicacion_actual': q['explicacion']
        })

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(batch_data, f, ensure_ascii=False, indent=2)

    print(f"Exported batch {batch_num}: {len(batch)} questions")
    print(f"Total needing improvement: {len(questions_needing_improvement)}")
    print(f"File: {output_file}")

    return len(questions_needing_improvement), len(batch)

def import_improved_explanations(batch_file):
    """Import improved explanations from a processed batch file."""
    # Load the batch file with improved explanations
    with open(batch_file, 'r', encoding='utf-8') as f:
        improved_batch = json.load(f)

    # Load main question bank
    data = load_questions()
    questions = data['preguntas']

    # Create mapping
    improvements = {item['id']: item.get('explicacion_mejorada', item.get('explicacion_actual'))
                   for item in improved_batch}

    # Update questions
    updated_count = 0
    for q in questions:
        if q['id'] in improvements:
            q['explicacion'] = improvements[q['id']]
            updated_count += 1

    # Save updated question bank
    with open(QUESTION_BANK_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Updated {updated_count} explanations from {batch_file}")

def analyze_status():
    """Show current status of explanations."""
    data = load_questions()
    questions = data['preguntas']

    total = len(questions)
    needs_improvement = sum(1 for q in questions if needs_better_explanation(q))
    has_generic = sum(1 for q in questions if 'clavijero oficial PAES' in q.get('explicacion', ''))

    print(f"Total questions: {total}")
    print(f"Needs improvement (generic explanations): {needs_improvement}")
    print(f"Still has 'clavijero' reference: {has_generic}")
    print(f"Good explanations: {total - needs_improvement - has_generic}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python enhance_explanations.py status")
        print("  python enhance_explanations.py export <batch_num> [batch_size]")
        print("  python enhance_explanations.py import <batch_file>")
        sys.exit(1)

    command = sys.argv[1]

    if command == "status":
        analyze_status()

    elif command == "export":
        if len(sys.argv) < 3:
            print("Error: batch number required")
            sys.exit(1)
        batch_num = int(sys.argv[2])
        batch_size = int(sys.argv[3]) if len(sys.argv) > 3 else 20
        export_questions_for_ai(batch_num, batch_size)

    elif command == "import":
        if len(sys.argv) < 3:
            print("Error: batch file required")
            sys.exit(1)
        batch_file = sys.argv[2]
        import_improved_explanations(batch_file)

    else:
        print(f"Unknown command: {command}")
        sys.exit(1)
