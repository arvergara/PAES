#!/usr/bin/env python3
"""
Process all M1 clavijeros and apply to question bank
"""
import json
import re
from pathlib import Path
from collections import defaultdict

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
                # M1 uses A-D (4 options)
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

def main():
    pruebas_dir = Path("/Users/alfil/Library/CloudStorage/GoogleDrive-andres.vergara@maindset.cl/Mi unidad/5_PAES/Nuevo_PAES/pruebas")

    # Find all M1 clavijero text files
    clavijero_files = list(pruebas_dir.glob("*m1*.txt"))
    clavijero_files.extend(pruebas_dir.glob("*matemat*.txt"))

    # Remove clavijero_m1_2025.txt which is duplicate
    clavijero_files = [f for f in clavijero_files if f.name != "clavijero_m1_2025.txt"]

    print(f"Encontrados {len(clavijero_files)} clavijeros M1:\n")

    # Parse all clavijeros
    all_answers = defaultdict(list)

    for clav_file in sorted(clavijero_files):
        print(f"Procesando: {clav_file.name}")
        answers = parse_clavijero(clav_file)
        print(f"  Encontradas {len(answers)} respuestas")

        for q_num, answer in answers.items():
            all_answers[q_num].append((clav_file.stem, answer))

    # Load question bank
    bank_file = pruebas_dir / "m1_question_bank.json"
    with open(bank_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    preguntas = data.get('preguntas', [])
    print(f"\nTotal preguntas en banco: {len(preguntas)}\n")

    # Match and update
    matched = 0
    changed = 0
    conflicts = []

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
                # Use most recent (last in sorted list)
                correct_answer = answers_list[-1][1]
                conflicts.append((q_id, q_num, unique_answers))

            old_answer = q.get('correcta', '')
            q['correcta'] = correct_answer
            q['explicacion'] = f"La alternativa {correct_answer} es la correcta según el clavijero oficial PAES M1."

            if old_answer != correct_answer:
                print(f"{q_id} (Q#{q_num}): {old_answer} → {correct_answer}")
                changed += 1

            matched += 1

    print(f"\n{'='*60}")
    print(f"Resultados:")
    print(f"  Coincidencias: {matched}")
    print(f"  Respuestas cambiadas: {changed}")
    print(f"  Conflictos (diferentes respuestas): {len(conflicts)}")
    print(f"  Sin coincidencia: {len(preguntas) - matched}")

    if conflicts:
        print(f"\nConflictos detectados (primeras 5):")
        for q_id, q_num, answers in conflicts[:5]:
            print(f"  {q_id} (Q#{q_num}): {answers}")

    # Save
    with open(bank_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\nGuardado: {bank_file}")

    # Distribution
    from collections import Counter
    answer_dist = Counter(q.get('correcta', '') for q in preguntas)
    print(f"\nDistribución de respuestas:")
    total = len(preguntas)
    for letter in ['A', 'B', 'C', 'D']:
        count = answer_dist[letter]
        percent = (count / total * 100) if total else 0
        print(f"  {letter}: {count:3d} ({percent:5.1f}%)")

if __name__ == '__main__':
    main()
