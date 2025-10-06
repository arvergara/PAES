#!/usr/bin/env python3
"""
Script para procesar archivos PDF de pruebas PAES oficiales y convertirlos en ejemplos
para el generador de preguntas.
"""

import os
import argparse
import logging
import re
import json
from pathlib import Path
from pypdf import PdfReader

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("ConvertidorPAES")

# Patrones para identificar asignaturas
SUBJECT_PATTERNS = {
    "M1": ["M1-", "M1_"],
    "M2": ["M2-", "M2_"],
    "M": ["M-", "M_"],  # Matemáticas (genérico)
    "L": ["L-", "L_"],  # Lenguaje
    "H": ["H-", "H_"],  # Historia
    "C-biologia": ["C-biologia-", "biologia"],  # Ciencias - Biología
    "C-fisica": ["C-fisica-", "fisica"],  # Ciencias - Física
    "C-quimica": ["C-quimica-", "quimica"]  # Ciencias - Química
}

def determine_subject(filename):
    """Determina la asignatura a partir del nombre del archivo."""
    filename_lower = filename.lower()
    
    for subject, patterns in SUBJECT_PATTERNS.items():
        for pattern in patterns:
            if pattern.lower() in filename_lower:
                return subject
    
    return "unknown"

def extract_text_from_pdf(pdf_path):
    """Extrae el texto de un archivo PDF."""
    try:
        with open(pdf_path, "rb") as f:
            pdf = PdfReader(f)
            num_pages = len(pdf.pages)
            logger.info(f"Procesando PDF: {pdf_path} ({num_pages} páginas)")
            
            text = ""
            for i, page in enumerate(pdf.pages):
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n\n"
                logger.info(f"Página {i+1}/{num_pages} procesada")
            
            return text
            
    except Exception as e:
        logger.error(f"Error extrayendo texto del PDF {pdf_path}: {e}")
        return ""

def extract_questions(text, subject):
    """
    Extrae preguntas de selección múltiple del texto.
    Diferentes patrones según la asignatura.
    """
    questions = []
    
    # Patrón genérico para encontrar preguntas
    question_pattern = r'(?:Pregunta|PREGUNTA)\s+(\d+)[.\s\n]+(.*?)(?=(?:Pregunta|PREGUNTA)\s+\d+|$)'
    options_pattern = r'(?:^|\n)\s*([A-D])(?:\)|\.)(.+?)(?=(?:^|\n)\s*[A-D](?:\)|\.)|\n\s*\n|$)'
    
    # Buscar todas las preguntas en el texto
    matches = re.finditer(question_pattern, text, re.DOTALL)
    
    for match in matches:
        question_num = match.group(1)
        question_text = match.group(2).strip()
        
        # Buscar opciones dentro del texto de la pregunta
        options = {}
        options_matches = re.finditer(options_pattern, question_text)
        
        for opt_match in options_matches:
            letter = opt_match.group(1).lower()
            option_text = opt_match.group(2).strip()
            options[letter] = option_text
        
        # Solo guardar si encontramos al menos 4 opciones (a, b, c, d)
        if len(options) >= 4:
            # Limpiar el texto de la pregunta (quitar opciones)
            clean_question = re.sub(options_pattern, '', question_text, flags=re.DOTALL).strip()
            
            # Intentar determinar la respuesta correcta (no siempre es posible)
            correct_answer = ""
            
            questions.append({
                "num": question_num,
                "content": clean_question,
                "options": options,
                "correct_answer": correct_answer,
                "subject": subject
            })
    
    logger.info(f"Extraídas {len(questions)} preguntas del PDF")
    return questions

def save_questions(questions, output_path):
    """Guarda las preguntas en formato JSON."""
    try:
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(questions, f, indent=2, ensure_ascii=False)
        logger.info(f"Guardadas {len(questions)} preguntas en {output_path}")
    except Exception as e:
        logger.error(f"Error guardando preguntas en {output_path}: {e}")

def process_pdf(pdf_path, output_dir):
    """Procesa un archivo PDF de prueba PAES y guarda las preguntas extraídas."""
    filename = os.path.basename(pdf_path)
    subject = determine_subject(filename)
    
    if subject == "unknown":
        logger.warning(f"No se pudo determinar la asignatura para {filename}")
        return
    
    text = extract_text_from_pdf(pdf_path)
    if not text:
        logger.error(f"No se pudo extraer texto de {filename}")
        return
    
    questions = extract_questions(text, subject)
    if not questions:
        logger.warning(f"No se encontraron preguntas en {filename}")
        return
    
    # Guardar preguntas
    output_filename = f"{os.path.splitext(filename)[0]}_questions.json"
    output_path = os.path.join(output_dir, output_filename)
    save_questions(questions, output_path)
    
    # Guardar también el texto completo para referencia
    output_txt = os.path.join(output_dir, f"{os.path.splitext(filename)[0]}.txt")
    with open(output_txt, "w", encoding="utf-8") as f:
        f.write(text)
    logger.info(f"Guardado texto completo en {output_txt}")

def process_directory(input_dir, output_dir):
    """Procesa todos los archivos PDF en un directorio."""
    input_path = Path(input_dir)
    
    if not input_path.is_dir():
        logger.error(f"El directorio {input_dir} no existe")
        return
    
    # Crear directorio de salida si no existe
    os.makedirs(output_dir, exist_ok=True)
    
    # Encontrar todos los PDFs
    pdf_files = list(input_path.glob("*.pdf"))
    
    if not pdf_files:
        logger.warning(f"No se encontraron archivos PDF en {input_dir}")
        return
    
    logger.info(f"Encontrados {len(pdf_files)} archivos PDF para procesar")
    
    # Procesar cada PDF
    for pdf_path in pdf_files:
        process_pdf(str(pdf_path), output_dir)
    
    # Generar archivo de índice por asignatura
    generate_subject_index(output_dir)

def generate_subject_index(output_dir):
    """Genera archivos de índice por asignatura que combinan todas las preguntas."""
    subject_questions = {}
    
    # Buscar todos los archivos JSON de preguntas
    json_files = list(Path(output_dir).glob("*_questions.json"))
    
    for json_file in json_files:
        try:
            with open(json_file, "r", encoding="utf-8") as f:
                questions = json.load(f)
                
                # Agrupar por asignatura
                for question in questions:
                    subject = question.get("subject", "unknown")
                    if subject not in subject_questions:
                        subject_questions[subject] = []
                    subject_questions[subject].append(question)
        except Exception as e:
            logger.error(f"Error leyendo {json_file}: {e}")
    
    # Guardar índices por asignatura
    for subject, questions in subject_questions.items():
        output_path = os.path.join(output_dir, f"{subject}_examples.json")
        try:
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(questions, f, indent=2, ensure_ascii=False)
            logger.info(f"Guardado índice para {subject} con {len(questions)} preguntas en {output_path}")
        except Exception as e:
            logger.error(f"Error guardando índice para {subject}: {e}")

def main():
    parser = argparse.ArgumentParser(description="Convertidor de PDFs de pruebas PAES a ejemplos JSON")
    parser.add_argument("--input", type=str, default="pruebas",
                      help="Directorio que contiene los PDFs de pruebas PAES")
    parser.add_argument("--output", type=str, default="content/examples",
                      help="Directorio donde guardar los ejemplos extraídos")
    
    args = parser.parse_args()
    
    # Procesar el directorio
    process_directory(args.input, args.output)
    logger.info("Proceso completado")

if __name__ == "__main__":
    main() 