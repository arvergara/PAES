#!/usr/bin/env python
"""
Script simple para probar OCR en un PDF
"""

import sys
from pathlib import Path

# Agregar el directorio scripts al path
sys.path.insert(0, str(Path(__file__).parent))

from ocr.pdf_processor import PDFProcessor

def main():
    if len(sys.argv) < 2:
        print("Uso: python testOcrSimple.py <archivo.pdf>")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    subject = sys.argv[2] if len(sys.argv) > 2 else None
    
    print(f"Procesando: {pdf_path}")
    
    processor = PDFProcessor(output_dir="./test_output")
    result = processor.process_pdf(pdf_path, subject, skip_pages=2)
    
    print(f"\nResultados:")
    print(f"- Páginas procesadas: {result['total_pages']}")
    print(f"- Preguntas encontradas: {result['total_questions']}")
    print(f"- Imágenes extraídas: {result['total_images']}")
    print(f"- Tablas detectadas: {result['total_tables']}")
    
    if result['questions']:
        print(f"\nPrimera pregunta encontrada:")
        q = result['questions'][0]
        print(f"- Número: {q['question_number']}")
        print(f"- Contenido: {q['content'][:100]}...")
        print(f"- Opciones: {len(q['options'])}")

if __name__ == "__main__":
    main()