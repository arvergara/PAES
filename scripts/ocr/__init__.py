"""
OCR Module for PAES PDF Processing
==================================

Este módulo proporciona herramientas para procesar PDFs PAES:
- Extracción de texto con OCR
- Extracción de imágenes
- Detección de tablas
- Asociación pregunta-imagen
"""

from .pdf_processor import PDFProcessor

__all__ = ['PDFProcessor']