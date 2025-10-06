#!/usr/bin/env python3
"""
Script auxiliar para extraer contenido de archivos PDF y guardarlo como TXT.
"""

import os
import argparse
import logging
from pathlib import Path
from pypdf import PdfReader

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("ExtractorPDF")

def extract_text_from_pdf(pdf_path: str, output_path: str = None) -> str:
    """
    Extrae el texto de un archivo PDF.
    
    Args:
        pdf_path: Ruta al archivo PDF
        output_path: Ruta donde guardar el archivo de texto (opcional)
        
    Returns:
        El texto extraído del PDF
    """
    try:
        # Abrir el PDF
        with open(pdf_path, "rb") as f:
            pdf = PdfReader(f)
            num_pages = len(pdf.pages)
            logger.info(f"Procesando PDF: {pdf_path} ({num_pages} páginas)")
            
            # Extraer texto de cada página
            text = ""
            for i, page in enumerate(pdf.pages):
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n\n"
                logger.info(f"Página {i+1}/{num_pages} procesada")
            
            # Guardar en archivo si se especificó una ruta
            if output_path:
                with open(output_path, "w", encoding="utf-8") as f:
                    f.write(text)
                logger.info(f"Texto guardado en: {output_path}")
            
            return text
            
    except Exception as e:
        logger.error(f"Error extrayendo texto del PDF {pdf_path}: {e}")
        return ""

def process_directory(directory: str, output_dir: str = None):
    """
    Procesa todos los archivos PDF en un directorio.
    
    Args:
        directory: Directorio con los PDFs
        output_dir: Directorio donde guardar los archivos de texto
    """
    directory_path = Path(directory)
    
    if not directory_path.is_dir():
        logger.error(f"El directorio {directory} no existe")
        return
    
    # Si no se especifica output_dir, usar el mismo directorio
    if output_dir is None:
        output_dir = directory
    else:
        # Crear directorio si no existe
        os.makedirs(output_dir, exist_ok=True)
    
    # Encontrar todos los PDFs
    pdf_files = list(directory_path.glob("*.pdf"))
    
    if not pdf_files:
        logger.warning(f"No se encontraron archivos PDF en {directory}")
        return
    
    logger.info(f"Encontrados {len(pdf_files)} archivos PDF para procesar")
    
    # Procesar cada PDF
    for pdf_path in pdf_files:
        output_path = Path(output_dir) / f"{pdf_path.stem}.txt"
        extract_text_from_pdf(str(pdf_path), str(output_path))

def main():
    parser = argparse.ArgumentParser(description="Extractor de texto de PDFs para el generador de preguntas PAES")
    parser.add_argument("--input", type=str, default="content",
                      help="Archivo PDF o directorio que contiene PDFs")
    parser.add_argument("--output", type=str,
                      help="Ruta donde guardar el texto extraído (opcional)")
    
    args = parser.parse_args()
    
    input_path = Path(args.input)
    
    if input_path.is_file() and input_path.suffix.lower() == '.pdf':
        # Procesar un solo archivo
        output_path = args.output if args.output else str(input_path.with_suffix('.txt'))
        extract_text_from_pdf(str(input_path), output_path)
    elif input_path.is_dir():
        # Procesar todo un directorio
        process_directory(str(input_path), args.output)
    else:
        logger.error(f"La ruta especificada {args.input} no es un archivo PDF ni un directorio")

if __name__ == "__main__":
    main() 