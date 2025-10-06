#!/usr/bin/env python
"""
Script auxiliar para clasificación batch de preguntas
=====================================================

Lee preguntas desde stdin, las clasifica y devuelve el resultado por stdout
"""

import sys
import json
import os
from pathlib import Path

# Agregar el directorio scripts al path
sys.path.insert(0, str(Path(__file__).parent))

from classification.taxonomy_classifier import TaxonomyClassifier


def parse_args():
    import argparse

    parser = argparse.ArgumentParser(
        description="Clasifica preguntas PAES usando el temario oficial"
    )
    parser.add_argument("--input", type=Path, help="Archivo JSON/JSONL con preguntas a clasificar")
    parser.add_argument("--output", type=Path, help="Ruta donde guardar el resultado clasificado")
    parser.add_argument("--subject", help="Materia a usar si las preguntas no la incluyen")
    parser.add_argument("--temario", type=Path,
                        default=Path(__file__).parent.parent / "content" / "temario_paes_vs.csv",
                        help="Ruta al CSV del temario PAES")
    parser.add_argument("--model", default="MoritzLaurer/mDeBERTa-v3-base-mnli-xnli",
                        help="Modelo zero-shot de Hugging Face")
    parser.add_argument("--device", type=int, default=-1, help="Dispositivo para Transformers (-1=CPU, 0=GPU)")
    parser.add_argument("--summary", action="store_true",
                        help="Imprimir un resumen de áreas/temas tras clasificar")
    parser.add_argument("--format", choices=["json", "jsonl"], default="json",
                        help="Formato de escritura cuando se usa --output")
    return parser.parse_args()

def main():
    """Función principal"""
    args = parse_args()

    try:
        if args.input:
            if not args.input.exists():
                raise FileNotFoundError(f"No existe el archivo de entrada: {args.input}")

            if args.input.suffix.lower() == ".jsonl":
                questions = [json.loads(line) for line in args.input.read_text(encoding="utf-8").splitlines() if line.strip()]
            else:
                questions = json.loads(args.input.read_text(encoding="utf-8"))
        else:
            input_data = sys.stdin.read()
            if not input_data.strip():
                raise ValueError("No se recibieron preguntas por stdin ni se especificó --input")
            questions = json.loads(input_data)

        if not isinstance(questions, list):
            raise ValueError("El formato de entrada debe ser una lista de preguntas")

        classifier = TaxonomyClassifier(
            temario_path=str(args.temario),
            model_name=args.model,
            device=args.device
        )

        for question in questions:
            question.setdefault("subject", args.subject)

        classified_questions = classifier.classify_batch(
            questions,
            show_progress=not args.output  # mostrar progreso si se emplea via CLI interactivo
        )

        if args.summary:
            areas = {}
            for q in classified_questions:
                area = q.get("area_tematica", "Sin área")
                areas[area] = areas.get(area, 0) + 1
            print("Resumen por área temática:")
            for area, count in sorted(areas.items(), key=lambda item: item[1], reverse=True):
                print(f"  - {area}: {count}")

        if args.output:
            args.output.parent.mkdir(parents=True, exist_ok=True)
            if args.format == "jsonl":
                args.output.write_text(
                    "\n".join(json.dumps(q, ensure_ascii=False) for q in classified_questions),
                    encoding="utf-8"
                )
            else:
                args.output.write_text(json.dumps(classified_questions, ensure_ascii=False, indent=2), encoding="utf-8")
            print(f"Resultados guardados en {args.output}")
        else:
            print(json.dumps(classified_questions, ensure_ascii=False))

    except Exception as e:
        print(f"Error en classify_batch.py: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
