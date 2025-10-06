import json
import sys

def analyze_and_correct_question(q, index):
    """
    Manually analyze each question and determine correct answer
    Returns: (correct_answer, explanation, was_changed)
    """
    qid = q.get('id', f'unknown_{index}')
    texto = q.get('texto', '')
    alternativas = q.get('alternativas', [])
    current_answer = q.get('correcta', '')

    # This will be a comprehensive manual review
    # I'll need to read each question carefully and determine the right answer

    changes = {
        'H_combined_002': ('A', 'La práctica descrita evidencia la externalización del deterioro ambiental, donde países desarrollados trasladan sus desechos tecnológicos a naciones pobres africanas para evitar costos ambientales y sanitarios, constituyendo una forma de injusticia ambiental global.'),
        'H_combined_003': ('A', 'El principal propósito de la red ferroviaria en el siglo XIX fue conectar centros productivos (minas de cobre y salitre, haciendas agrícolas) con ciudades y puertos, facilitando el transporte de exportaciones y dinamizando el comercio interno y externo del país.'),
        'H_combined_004': ('A', 'El Estado docente asumió un rol protagónico en educación desde la planificación curricular hasta la implementación en establecimientos públicos, buscando formar ciudadanos con valores nacionales laicos y conocimientos científicos, diferenciándose de la educación religiosa tradicional.'),
        'H_combined_005': ('C', 'El otorgamiento de créditos estadounidenses a países aliados europeos durante la Primera Guerra Mundial fortaleció la economía de EEUU, transformándolo de nación deudora a principal acreedor mundial y consolidando su emergencia como potencia económica global.'),
    }

    if qid in changes:
        new_answer, explanation = changes[qid]
        was_changed = (new_answer != current_answer)
        return new_answer, explanation, was_changed

    # For questions not in the manual list, return current values
    return current_answer, q.get('explicacion', ''), False

def main():
    file_path = "/Users/alfil/Library/CloudStorage/GoogleDrive-andres.vergara@maindset.cl/Mi unidad/5_PAES/Nuevo_PAES/pruebas/h_question_bank.json"

    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    preguntas = data.get('preguntas', [])

    changes_made = 0

    for i, q in enumerate(preguntas):
        correct_answer, explanation, was_changed = analyze_and_correct_question(q, i)

        if was_changed:
            print(f"Changed {q['id']}: {q['correcta']} → {correct_answer}")
            changes_made += 1

        q['correcta'] = correct_answer
        q['explicacion'] = explanation

    # Save
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\nTotal changes made: {changes_made}")
    print(f"File saved: {file_path}")

if __name__ == '__main__':
    main()
