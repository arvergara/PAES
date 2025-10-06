import argparse
import json
import re
import unicodedata
from pathlib import Path

OPTION_PATTERN = re.compile(r'([A-E])\)\s*(.*?)(?=(?:\n[A-E]\)|\n[A-E] )|$)', re.S)
FOOTER_REGEXES = [
    re.compile(r'^forma\b', re.I),
    re.compile(r'^modelo de prueba', re.I),
    re.compile(r'^-?\s*\d+\s*-\s*\d+\s*-?$', re.I),
    re.compile(r'^trv$', re.I),
    re.compile(r'^https?://', re.I),
    re.compile(r'^–+$'),
]
INLINE_FOOTER_REGEXES = [
    re.compile(r'\bMODELO\b[^.]*$', re.I),
    re.compile(r'\bFORMA\b[^.]*$', re.I),
    re.compile(r'-\s*\d+\s*-?\s*$', re.I),
    re.compile(r'–+$'),
]
REPLACEMENTS = {
    '': '[',
    '': ']',
    '': '-',
    '': '/',
    '': ')',
    '': '(',
    '': '/',
    '': '(',
}


def normalise_text(value: str) -> str:
    text = value
    for old, new in REPLACEMENTS.items():
        text = text.replace(old, new)
    text = unicodedata.normalize('NFKC', text)
    text = text.replace('\r', '')
    return text


def is_footer(line: str) -> bool:
    stripped = line.strip()
    if not stripped:
        return False
    return any(regex.match(stripped) for regex in FOOTER_REGEXES)


def strip_footers(text: str) -> str:
    lines = [line for line in text.split('\n') if not is_footer(line)]
    return '\n'.join(lines).strip()


def strip_inline_footers(text: str) -> str:
    cleaned = text
    for regex in INLINE_FOOTER_REGEXES:
        cleaned = regex.sub('', cleaned)
    return cleaned.strip()


def collapse_lines(text: str) -> str:
    paragraphs = []
    current = []
    for raw_line in text.split('\n'):
        line = raw_line.strip()
        if not line:
            if current:
                paragraphs.append(' '.join(current))
                current = []
            continue
        current.append(line)
    if current:
        paragraphs.append(' '.join(current))
    return '\n\n'.join(paragraphs)


def parse_options(raw_options: list[str]) -> list[str]:
    combined = '\n'.join(strip_inline_footers(normalise_text(opt or '')) for opt in raw_options if opt is not None)
    combined = strip_footers(combined)
    matches = OPTION_PATTERN.findall(combined)

    seen = set()
    cleaned = []
    for label, body in matches:
        label = label.upper()
        text = collapse_lines(strip_inline_footers(strip_footers(body)))
        if not text or label in seen:
            continue
        cleaned.append(f"{label}) {text}")
        seen.add(label)

    if not cleaned:
        seq = []
        chunks = [collapse_lines(strip_inline_footers(strip_footers(chunk))).strip() for chunk in combined.split('\n') if chunk.strip()]
        for idx, chunk in enumerate(chunks[:5]):
            label = chr(ord('A') + idx)
            seq.append(f"{label}) {chunk}")
        cleaned = seq

    return cleaned


def clean_question(question: dict) -> dict:
    question = question.copy()
    question['texto'] = collapse_lines(strip_inline_footers(strip_footers(normalise_text(question.get('texto', '')))))

    raw_opts = question.get('alternativas') or []
    if isinstance(raw_opts, list):
        question['alternativas'] = parse_options([str(opt) for opt in raw_opts])
    else:
        question['alternativas'] = []

    return question


def process_file(path: Path, output: Path) -> None:
    print(f"Procesando {path}")
    data = json.loads(path.read_text(encoding='utf-8'))
    preguntas = data.get('preguntas')
    if not isinstance(preguntas, list):
        raise ValueError('Estructura inesperada: falta la clave "preguntas"')

    cleaned = [clean_question(q) for q in preguntas]
    data['preguntas'] = cleaned
    output.write_text(json.dumps(data, ensure_ascii=False, indent=4), encoding='utf-8')
    print(f"Archivo limpio escrito en {output}")


def main():
    parser = argparse.ArgumentParser(description='Limpia pies de página y opciones OCR defectuosas en bancos JSON.')
    parser.add_argument('inputs', nargs='+', type=Path, help='Archivos JSON a limpiar')
    parser.add_argument('--suffix', default='_clean', help='Sufijo para el archivo de salida')
    args = parser.parse_args()

    for input_path in args.inputs:
        if not input_path.exists():
            print(f"Saltando {input_path}, no existe")
            continue
        output_path = input_path.with_name(input_path.stem + args.suffix + input_path.suffix)
        process_file(input_path, output_path)


if __name__ == '__main__':
    main()
