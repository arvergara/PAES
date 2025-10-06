#!/usr/bin/env python
"""Test rápido de OCR en una página"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from pdf2image import convert_from_path
import pytesseract

pdf_path = sys.argv[1] if len(sys.argv) > 1 else "../../TUPAES/Pruebas/interim/M2-2024-1.pdf"

print(f"Procesando primera página de: {pdf_path}")

# Convertir solo la primera página
pages = convert_from_path(pdf_path, dpi=150, first_page=3, last_page=3)

if pages:
    print("Extrayendo texto con OCR...")
    text = pytesseract.image_to_string(pages[0], lang='spa')
    print(f"\nPrimeros 500 caracteres del texto extraído:")
    print("-" * 50)
    print(text[:500])
    print("-" * 50)
    print(f"\nTotal de caracteres extraídos: {len(text)}")
else:
    print("No se pudo convertir el PDF")