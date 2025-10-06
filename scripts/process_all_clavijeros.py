#!/usr/bin/env python3
"""
Process all clavijeros (answer keys) and match them with question bank
"""
import json
import re
from pathlib import Path
from collections import defaultdict

def parse_clavijero(file_path):
    """Parse a clavijero text file and extract question-answer mapping"""
    with open(file_path, 'r', encoding='utf-8') as f:
        text = f.read()

    answer_key = {}
    lines = text.split('\n')

    i = 0
    while i < len(lines):
        line = lines[i].strip()
        # Check if it's a number (question number)
        if line.isdigit():
            q_num = int(line)
            # Look ahead for the answer (should be within next few lines)
            for j in range(i+1, min(i+5, len(lines))):
                next_line = lines[j].strip()
                # Check if it's an answer (A-E, possibly with *)
                if re.match(r'^[A-E]\*?$', next_line):
                    answer = next_line.replace('*', '')  # Remove asterisk
                    answer_key[q_num] = answer
                    break
        i += 1

    return answer_key

def extract_question_number(question_text):
    """Extract the original question number from question text"""
    match = re.match(r'^(\d+)\.\s', question_text)
    if match:
        return int(match.group(1))
    return None

def main():
    pruebas_dir = Path("/Users/alfil/Library/CloudStorage/GoogleDrive-andres.vergara@maindset.cl/Mi unidad/5_PAES/Nuevo_PAES/pruebas")

    # Find all clavijero text files
    clavijero_files = list(pruebas_dir.glob("*clavijero*.txt"))

    print(f"Found {len(clavijero_files)} clavijero files\n")

    # Parse all clavijeros
    all_answers = defaultdict(list)  # question_num -> [(source, answer)]

    for clav_file in sorted(clavijero_files):
        print(f"Processing: {clav_file.name}")
        answers = parse_clavijero(clav_file)
        print(f"  Found {len(answers)} answers")

        for q_num, answer in answers.items():
            all_answers[q_num].append((clav_file.stem, answer))

    # Load question bank
    bank_file = pruebas_dir / "h_question_bank.json"
    with open(bank_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    preguntas = data.get('preguntas', [])
    print(f"\nTotal questions in bank: {len(preguntas)}")

    # Create mapping: question_id -> original_question_number
    question_mapping = {}
    for q in preguntas:
        q_id = q['id']
        q_text = q.get('texto', '')
        q_num = extract_question_number(q_text)
        if q_num:
            question_mapping[q_id] = q_num

    print(f"Questions with extractable numbers: {len(question_mapping)}")

    # Match and update
    matched = 0
    not_matched = 0
    conflicts = []

    for q in preguntas:
        q_id = q['id']
        q_num = question_mapping.get(q_id)

        if q_num and q_num in all_answers:
            # Found matching answer(s)
            answers_list = all_answers[q_num]

            # Check if all sources agree
            unique_answers = set(ans for _, ans in answers_list)

            if len(unique_answers) == 1:
                # All agree
                correct_answer = unique_answers.pop()
                q['correcta'] = correct_answer
                matched += 1
            else:
                # Conflict - use most recent (last in sorted list)
                correct_answer = answers_list[-1][1]
                q['correcta'] = correct_answer
                conflicts.append((q_id, q_num, unique_answers))
                matched += 1
        else:
            not_matched += 1

    print(f"\nMatching results:")
    print(f"  Matched: {matched}")
    print(f"  Not matched: {not_matched}")
    print(f"  Conflicts (multiple different answers): {len(conflicts)}")

    if conflicts:
        print(f"\nConflicts detected:")
        for q_id, q_num, answers in conflicts[:10]:
            print(f"  {q_id} (Q#{q_num}): {answers}")

    # Save updated question bank
    output_file = pruebas_dir / "h_question_bank_corrected.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\nSaved corrected question bank to: {output_file}")

    # Distribution of answers
    from collections import Counter
    answer_dist = Counter(q.get('correcta', '') for q in preguntas)
    print(f"\nAnswer distribution:")
    for letter in ['A', 'B', 'C', 'D', 'E']:
        count = answer_dist[letter]
        percent = (count / len(preguntas) * 100) if preguntas else 0
        print(f"  {letter}: {count:3d} ({percent:5.1f}%)")

if __name__ == '__main__':
    main()
