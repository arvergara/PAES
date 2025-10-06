#!/usr/bin/env python3
"""
Script to generate detailed, specific explanations for Chilean History PAES questions.
This script reads the h_question_bank.json file and generates educational explanations
for each question based on the question content and correct answer.
"""

import json
import os
from typing import Dict, List, Any
import anthropic

# File path
QUESTION_BANK_PATH = "/Users/alfil/Library/CloudStorage/GoogleDrive-andres.vergara@maindset.cl/Mi unidad/5_PAES/Nuevo_PAES/pruebas/h_question_bank.json"

def load_question_bank() -> Dict[str, Any]:
    """Load the question bank from JSON file."""
    with open(QUESTION_BANK_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_question_bank(data: Dict[str, Any]) -> None:
    """Save the updated question bank to JSON file."""
    with open(QUESTION_BANK_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def needs_explanation(question: Dict[str, Any]) -> bool:
    """Check if a question needs a new explanation."""
    explanation = question.get('explicacion', '')
    # Check if explanation is generic (contains "clavijero oficial PAES")
    return 'clavijero oficial PAES' in explanation or len(explanation) < 50

def generate_explanation_prompt(question: Dict[str, Any]) -> str:
    """Generate a prompt for creating a specific explanation."""
    texto = question.get('texto', '')
    alternativas = question.get('alternativas', [])
    correcta = question.get('correcta', '')
    area_tematica = question.get('area_tematica', '')
    tema = question.get('tema', '')
    subtema = question.get('subtema', '')

    # Get the correct alternative text
    correct_index = ord(correcta) - ord('A') if correcta else 0
    correct_text = alternativas[correct_index] if correct_index < len(alternativas) else ''

    prompt = f"""Genera una explicación ESPECÍFICA y EDUCATIVA en español para esta pregunta de Historia PAES de Chile:

PREGUNTA: {texto}

ALTERNATIVAS:
{chr(10).join(alternativas)}

ALTERNATIVA CORRECTA: {correcta}) {correct_text}

ÁREA TEMÁTICA: {area_tematica}
TEMA: {tema}
SUBTEMA: {subtema}

INSTRUCCIONES:
1. Explica POR QUÉ la alternativa {correcta} es correcta
2. Incluye DATOS ESPECÍFICOS (fechas, eventos históricos, conceptos clave)
3. Usa 2-4 oraciones
4. Lenguaje académico apropiado para estudiantes chilenos de secundaria
5. NO uses frases genéricas como "según el clavijero"
6. Enfócate en el CONTENIDO HISTÓRICO, GEOGRÁFICO, ECONÓMICO o CÍVICO

CONTEXTO HISTÓRICO RELEVANTE:
- Historia de Chile: Independencia (1810-1818), República (1818-1973), Dictadura (1973-1990), Democracia (1990-presente)
- Historia Mundial: Revolución Industrial, Guerras Mundiales, Guerra Fría, Globalización
- Economía: Salitre, cobre, agricultura, comercio internacional
- Geografía: Regiones, clima, recursos naturales
- Formación Ciudadana: Democracia, derechos humanos, instituciones

Genera SOLO la explicación, sin introducción ni comentarios adicionales."""

    return prompt

def generate_explanation_with_claude(question: Dict[str, Any]) -> str:
    """Generate explanation using Claude API."""
    # Get API key from environment
    api_key = os.environ.get('ANTHROPIC_API_KEY')
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY environment variable not set")

    client = anthropic.Anthropic(api_key=api_key)

    prompt = generate_explanation_prompt(question)

    try:
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=500,
            temperature=0.7,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        explanation = message.content[0].text.strip()
        return explanation

    except Exception as e:
        print(f"Error generating explanation for question {question.get('id', 'unknown')}: {e}")
        return question.get('explicacion', '')  # Return original if error

def process_questions_batch(questions: List[Dict[str, Any]], start_idx: int, batch_size: int) -> int:
    """Process a batch of questions and generate explanations."""
    count = 0
    end_idx = min(start_idx + batch_size, len(questions))

    for i in range(start_idx, end_idx):
        question = questions[i]

        # Skip if already has good explanation
        if not needs_explanation(question):
            continue

        print(f"Processing question {i+1}/{len(questions)}: {question.get('id', 'unknown')}")

        # Generate explanation
        new_explanation = generate_explanation_with_claude(question)

        if new_explanation:
            question['explicacion'] = new_explanation
            count += 1
            print(f"  ✓ Generated explanation ({len(new_explanation)} chars)")
        else:
            print(f"  ✗ Failed to generate explanation")

    return count

def main():
    """Main function to process all questions."""
    print("="*80)
    print("CHILEAN HISTORY PAES - EXPLANATION GENERATOR")
    print("="*80)
    print()

    # Load question bank
    print("Loading question bank...")
    data = load_question_bank()
    questions = data.get('preguntas', [])
    total_questions = len(questions)
    print(f"✓ Loaded {total_questions} questions")
    print()

    # Count questions needing explanations
    questions_needing_update = sum(1 for q in questions if needs_explanation(q))
    print(f"Questions needing explanations: {questions_needing_update}/{total_questions}")
    print()

    if questions_needing_update == 0:
        print("All questions already have detailed explanations!")
        return

    # Ask for confirmation
    response = input(f"Generate explanations for {questions_needing_update} questions? (y/n): ")
    if response.lower() != 'y':
        print("Cancelled.")
        return

    print()
    print("Starting explanation generation...")
    print("-"*80)

    # Process all questions
    total_generated = 0
    batch_size = 50

    for start_idx in range(0, total_questions, batch_size):
        print(f"\nBatch {start_idx//batch_size + 1}: Questions {start_idx+1} to {min(start_idx+batch_size, total_questions)}")
        count = process_questions_batch(questions, start_idx, batch_size)
        total_generated += count

        # Save progress after each batch
        if count > 0:
            print(f"Saving progress... ({total_generated} explanations generated so far)")
            save_question_bank(data)

    print()
    print("="*80)
    print(f"COMPLETED! Generated {total_generated} new explanations")
    print("="*80)

    # Show sample of updated questions
    print("\nSample of updated explanations:")
    print("-"*80)
    sample_count = 0
    for q in questions:
        if not 'clavijero oficial PAES' in q.get('explicacion', '') and sample_count < 5:
            print(f"\nID: {q.get('id')}")
            print(f"Question: {q.get('texto', '')[:100]}...")
            print(f"Correct: {q.get('correcta')}")
            print(f"Explanation: {q.get('explicacion', '')}")
            sample_count += 1

if __name__ == "__main__":
    main()
