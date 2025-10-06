#!/usr/bin/env python3
"""
Process all science answer keys (Biología, Física, Química) and apply to question banks
"""
import json
import re
from pathlib import Path
from collections import defaultdict, Counter

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
                # Ciencias usa A-D (4 opciones)
                if re.match(r'^[A-D]\*?$', next_line):
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

def process_science_subject(subject_code, subject_name, bank_file, clavijero_files):
    """Process one science subject"""
    print(f"\n{'='*80}")
    print(f"Procesando {subject_name} ({subject_code})")
    print(f"{'='*80}\n")

    # Parse all clavijeros for this subject
    all_answers = defaultdict(list)

    for clav_file in clavijero_files:
        if not Path(clav_file).exists():
            print(f"⚠ No encontrado: {clav_file}")
            continue

        print(f"Leyendo: {Path(clav_file).name}")
        answers = parse_clavijero(clav_file)
        print(f"  Encontradas {len(answers)} respuestas")

        for q_num, answer in answers.items():
            all_answers[q_num].append((Path(clav_file).stem, answer))

    # Load question bank
    if not Path(bank_file).exists():
        print(f"✗ No encontrado: {bank_file}")
        return

    with open(bank_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    preguntas = data.get('preguntas', data if isinstance(data, list) else [])
    print(f"\nTotal preguntas en banco: {len(preguntas)}")

    # Match and update
    matched = 0
    changed = 0
    not_matched = []

    for q in preguntas:
        q_id = q['id']
        q_text = q.get('texto', '')
        q_num = extract_question_number(q_text)

        if q_num and q_num in all_answers:
            answers_list = all_answers[q_num]
            unique_answers = set(ans for _, ans in answers_list)

            if len(unique_answers) == 1:
                correct_answer = unique_answers.pop()
            else:
                # Use most recent
                correct_answer = answers_list[-1][1]

            old_answer = q.get('correcta', '')
            q['correcta'] = correct_answer
            q['explicacion'] = f"La alternativa {correct_answer} es la correcta según el clavijero oficial PAES {subject_name}."

            if old_answer != correct_answer:
                changed += 1

            matched += 1
        else:
            not_matched.append((q_id, q_num))

    print(f"\nResultados:")
    print(f"  Coincidencias: {matched}")
    print(f"  Respuestas cambiadas: {changed}")
    print(f"  Sin coincidencia: {len(not_matched)}")

    # Save
    with open(bank_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"✓ Guardado: {bank_file}")

    # Distribution
    answer_dist = Counter(q.get('correcta', '') for q in preguntas)
    print(f"\nDistribución de respuestas:")
    total = len(preguntas)
    for letter in ['A', 'B', 'C', 'D']:
        count = answer_dist[letter]
        percent = (count / total * 100) if total else 0
        print(f"  {letter}: {count:3d} ({percent:5.1f}%)")

def main():
    pruebas_dir = Path("/Users/alfil/Library/CloudStorage/GoogleDrive-andres.vergara@maindset.cl/Mi unidad/5_PAES/Nuevo_PAES/pruebas")

    # Process each science subject
    subjects = [
        {
            'code': 'CB',
            'name': 'Biología',
            'bank': pruebas_dir / 'cb_question_bank.json',
            'clavijeros': [
                pruebas_dir / 'bio_2023.txt',
            ]
        },
        {
            'code': 'CF',
            'name': 'Física',
            'bank': pruebas_dir / 'cf_question_bank.json',
            'clavijeros': [
                pruebas_dir / 'fisica_2023.txt',
            ]
        },
        {
            'code': 'CQ',
            'name': 'Química',
            'bank': pruebas_dir / 'cq_question_bank.json',
            'clavijeros': [
                pruebas_dir / 'quimica_2023.txt',
            ]
        }
    ]

    for subject in subjects:
        process_science_subject(
            subject['code'],
            subject['name'],
            subject['bank'],
            subject['clavijeros']
        )

    print(f"\n{'='*80}")
    print("✅ Procesamiento completo de Ciencias")
    print(f"{'='*80}\n")

if __name__ == '__main__':
    main()
