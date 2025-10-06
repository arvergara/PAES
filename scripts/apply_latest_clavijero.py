#!/usr/bin/env python3
"""
Apply latest clavijero (2025) to question bank and generate proper explanations
"""
import json
import re
from pathlib import Path

def parse_clavijero(file_path):
    """Parse a clavijero text file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        text = f.read()

    answer_key = {}
    lines = text.split('\n')

    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if line.isdigit():
            q_num = int(line)
            for j in range(i+1, min(i+5, len(lines))):
                next_line = lines[j].strip()
                if re.match(r'^[A-E]\*?$', next_line):
                    answer = next_line.replace('*', '')
                    answer_key[q_num] = answer
                    break
        i += 1

    return answer_key

def extract_question_number(question_text):
    """Extract original question number"""
    match = re.match(r'^(\d+)\.\s', question_text)
    if match:
        return int(match.group(1))
    return None

def generate_explanation(question, correct_letter):
    """Generate a basic explanation for the question"""
    texto = question.get('texto', '')
    alternativas = question.get('alternativas', [])

    if correct_letter in ['A', 'B', 'C', 'D', 'E']:
        idx = ord(correct_letter) - ord('A')
        if idx < len(alternativas):
            correct_alt = alternativas[idx]
            return f"La alternativa {correct_letter} es la correcta según el clavijero oficial PAES 2025."

    return "Respuesta correcta según clavijero oficial PAES."

def main():
    pruebas_dir = Path("/Users/alfil/Library/CloudStorage/GoogleDrive-andres.vergara@maindset.cl/Mi unidad/5_PAES/Nuevo_PAES/pruebas")

    # Use ONLY the latest clavijero
    latest_clav = pruebas_dir / "2025-25-01-06-clavijero-paes-regular-historia.txt"
    print(f"Using latest clavijero: {latest_clav.name}\n")

    clavijero = parse_clavijero(latest_clav)
    print(f"Loaded {len(clavijero)} answers from clavijero")

    # Load question bank
    bank_file = pruebas_dir / "h_question_bank.json"
    with open(bank_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    preguntas = data.get('preguntas', [])
    print(f"Total questions in bank: {len(preguntas)}\n")

    # Match and update
    matched = 0
    not_matched = 0
    not_matched_ids = []

    for q in preguntas:
        q_id = q['id']
        q_text = q.get('texto', '')
        q_num = extract_question_number(q_text)

        if q_num and q_num in clavijero:
            correct_answer = clavijero[q_num]
            old_answer = q.get('correcta', '')

            # Update answer
            q['correcta'] = correct_answer

            # Generate explanation
            q['explicacion'] = generate_explanation(q, correct_answer)

            if old_answer != correct_answer:
                print(f"{q_id} (Q#{q_num}): {old_answer} -> {correct_answer}")

            matched += 1
        else:
            not_matched_ids.append((q_id, q_num))
            not_matched += 1

    print(f"\n{'='*60}")
    print(f"Matching results:")
    print(f"  Matched with clavijero: {matched}")
    print(f"  Not matched: {len(not_matched_ids)}")

    if not_matched_ids:
        print(f"\nNot matched questions (first 10):")
        for q_id, q_num in not_matched_ids[:10]:
            print(f"  {q_id} (Q#{q_num})")

    # Save updated question bank
    output_file = pruebas_dir / "h_question_bank.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\nSaved to: {output_file}")

    # Distribution
    from collections import Counter
    answer_dist = Counter(q.get('correcta', '') for q in preguntas)
    print(f"\nAnswer distribution:")
    total = sum(answer_dist.values())
    for letter in ['A', 'B', 'C', 'D', 'E', '']:
        count = answer_dist[letter]
        percent = (count / total * 100) if total else 0
        if count > 0:
            label = letter if letter else '(empty)'
            print(f"  {label:7s}: {count:3d} ({percent:5.1f}%)")

if __name__ == '__main__':
    main()
