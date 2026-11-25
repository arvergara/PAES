#!/usr/bin/env python3
"""Tests de recorte: la pregunta N no debe incluir la N+1 ni el encabezado de forma."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))

from recrop_m1 import extract_question_text, crop_question_image  # noqa: E402

PDF_2023 = ROOT / "pruebas" / "oficiales" / "M1-2023-1.pdf"
PDF_2025I = ROOT / "pruebas" / "oficiales" / "M1-2025-invierno.pdf"


def test_q24_does_not_include_q25():
    text = extract_question_text(PDF_2023, 24)
    assert "factoriza" in text.lower() or "factores" in text.lower(), text[:400]
    assert "galletas" not in text.lower(), text[:400]
    assert not text.lstrip().startswith("FORMA"), text[:200]
    img = crop_question_image(PDF_2023, 24)
    assert img.width > 800
    assert img.height < 900, img.size


def test_q14_keeps_infographic_without_q15():
    text = extract_question_text(PDF_2025I, 14)
    assert "infograf" in text.lower() or "agua" in text.lower(), text[:400]
    assert "Instituto Nacional de Estadísticas" not in text, text[:400]
    img = crop_question_image(PDF_2025I, 14)
    assert img.width > 800
    assert img.height > 400


if __name__ == "__main__":
    test_q24_does_not_include_q25()
    print("q24 ok")
    test_q14_keeps_infographic_without_q15()
    print("q14 ok")
    print("recrop tests ok")
