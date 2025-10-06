#!/usr/bin/env python3
"""
Generador de prompts para crear preguntas PAES usando directamente ChatGPT, Claude o Grok
en sus interfaces web, sin necesidad de API.
"""

import os
import json
import argparse
import csv
import logging
from pathlib import Path
from typing import Dict, List, Optional, Any

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("GeneradorPrompts")

# Constantes
CONTENT_DIR = "content"
TEMARIO_CSV = "temario.csv"
OUTPUT_DIR = "prompts"
PREGUNTAS_POR_LOTE = 10  # Cuántas preguntas generar en cada prompt
MAX_CONTEXTO_CHARS = 8000  # Caracteres máximos para el contenido

# Asignaturas
SUBJECTS = {
    "M1": {"name": "Matemática 1", "content": "M1_content.pdf", "examples": "M1_examples.pdf"},
    "M2": {"name": "Matemática 2", "content": "M2_content.pdf", "examples": "M2_examples.pdf"},
    "L": {"name": "Lenguaje", "content": "L_content.pdf", "examples": "L_examples.pdf"},
    "C": {"name": "Ciencias", "content": "C_content.pdf", "examples": "C_examples.pdf"},
    "H": {"name": "Historia", "content": "H_content.pdf", "examples": "H_examples.pdf"},
}

def load_temario() -> Dict:
    """Carga el temario desde el archivo CSV."""
    temario = {}
    
    try:
        with open(TEMARIO_CSV, "r", encoding="utf-8") as f:
            content = f.read()
            lines = [line for line in content.split('\n') if line.strip()]
            
            header = [h.strip() for h in lines[0].split(';')]
            
            for line in lines[1:]:
                values = [v.strip() for v in line.split(';')]
                if len(values) >= len(header):
                    record = {header[i]: values[i] for i in range(len(header))}
                    
                    subject = record.get("Subject")
                    area = record.get("Área Temática")
                    tema = record.get("Tema")
                    subtema = record.get("Subtema")
                    
                    if not all([subject, area, tema]):
                        continue
                        
                    if subject not in temario:
                        temario[subject] = {}
                    if area not in temario[subject]:
                        temario[subject][area] = {}
                    if tema not in temario[subject][area]:
                        temario[subject][area][tema] = []
                    if subtema:
                        temario[subject][area][tema].append(subtema)
        
        logger.info(f"Temario cargado: {', '.join(temario.keys())} asignaturas")
        return temario
        
    except Exception as e:
        logger.error(f"Error cargando temario: {e}")
        return {}

def read_file(file_path: str) -> str:
    """Lee un archivo PDF o TXT."""
    try:
        path = Path(file_path)
        
        # Si el archivo es un PDF, intentar leer versión en texto
        if path.suffix.lower() == '.pdf':
            txt_path = path.with_suffix('.txt')
            if txt_path.exists():
                with open(txt_path, 'r', encoding='utf-8') as f:
                    return f.read()
            else:
                logger.warning(f"No se pudo encontrar una versión en texto de {file_path}")
                return f"[CONTENIDO DEL PDF {path.name} - COPIA EL CONTENIDO AQUÍ MANUALMENTE]"
        
        # Si es un archivo de texto
        elif path.suffix.lower() == '.txt':
            with open(path, 'r', encoding='utf-8') as f:
                return f.read()
        
        else:
            logger.warning(f"Formato de archivo no soportado: {path.suffix}")
            return ""
            
    except Exception as e:
        logger.error(f"Error leyendo archivo {file_path}: {e}")
        return ""

def generate_prompt(
    model: str,
    subject: str,
    area_tematica: str,
    tema: str,
    subtema: Optional[str],
    content: str,
    examples: str,
    batch_size: int
) -> str:
    """Construye el prompt para el modelo."""
    subject_name = SUBJECTS[subject]["name"]
    
    # Limitar contenido si es muy largo
    if len(content) > MAX_CONTEXTO_CHARS:
        content = content[:MAX_CONTEXTO_CHARS] + "..."
        logger.warning(f"Contenido truncado para {subject} debido a limitaciones de caracteres")
    
    # Instrucciones específicas según el modelo
    model_instrucciones = ""
    if "gpt" in model.lower():
        model_instrucciones = "Asegúrate de que el formato JSON sea completo y válido."
    elif "claude" in model.lower():
        model_instrucciones = "Genera JSON válido sin comentarios adicionales. No uses Markdown para el JSON."
    elif "grok" in model.lower():
        model_instrucciones = "Mantén el formato JSON exacto. No incluyas texto antes o después del JSON."
        
    # Construcción del prompt
    prompt = f"""Eres un experto profesor diseñando preguntas para la Prueba de Acceso a la Educación Superior (PAES) chilena en {subject_name}.

Área Temática: {area_tematica}
Tema: {tema}
Subtema: {subtema or "General"}

Referencia de Contenido (usa solo lo relevante para las preguntas):
{content}

Preguntas de ejemplo (formato y nivel de dificultad, NO USAR LAS MISMAS PREGUNTAS):
{examples}

Basado en el contenido y los ejemplos anteriores, genera {batch_size} preguntas de selección múltiple que sigan ESTRICTAMENTE estas reglas:
1. Las preguntas DEBEN ser relevantes para el área temática, tema y subtema especificados.
2. Todas las opciones DEBEN ser plausibles, pero SOLO UNA correcta. Evita opciones como "Todas las anteriores" o "Ninguna de las anteriores".
3. Incluye una explicación DETALLADA de por qué la respuesta correcta es correcta y por qué cada una de las otras opciones son incorrectas.
4. Las preguntas DEBEN evaluar habilidades de pensamiento de orden superior (análisis, aplicación, evaluación).
5. Asigna un nivel de dificultad según estos criterios:
   - Nivel 1: Conocimiento y comprensión básica.
   - Nivel 2: Aplicación directa de conceptos.
   - Nivel 3: Análisis y aplicación en contextos nuevos.
   - Nivel 4: Evaluación y resolución de problemas complejos.
   - Nivel 5: Síntesis y creación de soluciones originales (poco común).

{model_instrucciones}

Genera la respuesta SOLAMENTE en formato JSON como un arreglo de objetos con el siguiente esquema exacto:
```json
[
  {{
    "content": "Texto completo de la pregunta, incluyendo el enunciado y cualquier contexto necesario.",
    "options": {{
      "a": "Opción A completa.",
      "b": "Opción B completa.",
      "c": "Opción C completa.",
      "d": "Opción D completa."
    }},
    "correct_answer": "Letra de la opción correcta (a, b, c, o d).",
    "explanation": "Explicación detallada de por qué la respuesta correcta es correcta y por qué cada una de las incorrectas es incorrecta.",
    "subject": "{subject}",
    "area_tematica": "{area_tematica}",
    "tema": "{tema}",
    "subtema": "{subtema or ""}",
    "difficulty": "Número entre 1 y 5 según los criterios especificados."
  }},
  {{
    // Segunda pregunta con el mismo formato
  }},
  // Etc. para cada pregunta adicional hasta completar {batch_size} preguntas
]
```

IMPORTANTE: 
1. Asegúrate de que el JSON sea válido y que cada pregunta esté matemáticamente correcta. 
2. Verifica que las operaciones y cálculos en la explicación sean precisos.
3. NO incluyas ningún texto antes o después del JSON.
4. TODAS las preguntas deben tener exactamente 4 opciones: a, b, c y d.
"""

    return prompt

def generate_combine_instructions(num_prompts: int, model: str) -> str:
    """Genera instrucciones para combinar los resultados."""
    if "gpt" in model.lower():
        intro = "Eres un experto en procesamiento de datos JSON trabajando con datos educativos."
    elif "claude" in model.lower():
        intro = "Como especialista en estructuración de datos JSON para aplicaciones educativas,"
    else:
        intro = "Como experto en JSON para datos educativos,"
    
    return f"""{intro} necesito que combines varios archivos JSON de preguntas en uno solo.

Te proporcionaré {num_prompts} conjuntos de preguntas en formato JSON. Cada conjunto tiene la misma estructura.
Tu tarea es:

1. Combinar todos los conjuntos en un único array JSON
2. Verificar que no haya duplicados (si los hay, eliminarlos)
3. Verificar que todas las preguntas tengan el formato correcto:
   - Deben tener los campos: content, options, correct_answer, explanation, subject, area_tematica, tema, subtema, difficulty
   - options debe tener exactamente 4 opciones: a, b, c, d
   - correct_answer debe ser una de estas letras: a, b, c, d
   - difficulty debe ser un número entre 1 y 5

4. Entregar el resultado como un único JSON válido que pueda ser parseado directamente.

No incluyas ninguna explicación o texto adicional antes o después del JSON. Solo entrega el JSON final combinado.
"""

def generate_prompts_for_subject(
    subject: str, 
    temario: Dict, 
    model: str, 
    count: int = 100
) -> List[str]:
    """
    Genera prompts para una asignatura específica.
    
    Args:
        subject: Código de la asignatura
        temario: Diccionario con el temario completo
        model: Modelo a usar (para ajustar el prompt)
        count: Número total de preguntas a generar
        
    Returns:
        Lista de prompts generados
    """
    if subject not in SUBJECTS:
        logger.error(f"Asignatura no válida: {subject}")
        return []
        
    if subject not in temario:
        logger.error(f"No hay información de temario para {subject}")
        return []
        
    # Leer contenido y ejemplos
    content_path = os.path.join(CONTENT_DIR, SUBJECTS[subject]["content"])
    examples_path = os.path.join(CONTENT_DIR, SUBJECTS[subject]["examples"])
    
    subject_content = read_file(content_path)
    example_questions = read_file(examples_path)
    
    if not subject_content:
        logger.error(f"No se pudo leer el contenido para {subject}")
        return []
    
    # Calcular número de prompts necesarios
    num_prompts = (count + PREGUNTAS_POR_LOTE - 1) // PREGUNTAS_POR_LOTE
    prompts = []
    
    # Lista de todas las áreas, temas y subtemas para distribuir equitativamente
    areas = list(temario[subject].keys())
    topics = []
    
    for area in areas:
        for tema in temario[subject][area]:
            subtemas = temario[subject][area][tema]
            if not subtemas:
                topics.append((area, tema, None))
            else:
                for subtema in subtemas:
                    topics.append((area, tema, subtema))
    
    # Si hay menos topics que prompts, repetiremos algunos
    if len(topics) < num_prompts:
        topics = topics * ((num_prompts // len(topics)) + 1)
    
    # Generar los prompts necesarios
    for i in range(num_prompts):
        idx = i % len(topics)
        area, tema, subtema = topics[idx]
        
        prompt = generate_prompt(
            model=model,
            subject=subject,
            area_tematica=area,
            tema=tema,
            subtema=subtema,
            content=subject_content,
            examples=example_questions,
            batch_size=PREGUNTAS_POR_LOTE
        )
        
        prompts.append(prompt)
        logger.info(f"Generado prompt {i+1}/{num_prompts} para {subject}: {area} - {tema} - {subtema or 'General'}")
    
    return prompts

def save_prompts(prompts: List[str], subject: str, model: str, output_dir: str):
    """Guarda los prompts en archivos de texto."""
    subject_dir = os.path.join(output_dir, subject)
    os.makedirs(subject_dir, exist_ok=True)
    
    for i, prompt in enumerate(prompts):
        filename = f"{subject}_{model}_prompt_{i+1}.txt"
        filepath = os.path.join(subject_dir, filename)
        
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(prompt)
            
    logger.info(f"Guardados {len(prompts)} prompts en {subject_dir}")
    
    # Generar instrucciones para combinar resultados
    combine_instructions = generate_combine_instructions(len(prompts), model)
    combine_filepath = os.path.join(subject_dir, f"{subject}_{model}_combine_instructions.txt")
    
    with open(combine_filepath, "w", encoding="utf-8") as f:
        f.write(combine_instructions)
        
    logger.info(f"Guardadas instrucciones de combinación en {combine_filepath}")
    
    # Crear README con instrucciones
    readme_path = os.path.join(subject_dir, "README.md")
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write(f"""# Instrucciones para generar preguntas de {SUBJECTS[subject]['name']}

## Pasos a seguir:

1. Abre la interfaz web de {model.upper()} (ChatGPT, Claude o Grok).
2. Para cada archivo `{subject}_{model}_prompt_X.txt`:
   a. Copia todo el contenido del archivo
   b. Pégalo en la interfaz del modelo
   c. Ejecuta la consulta y espera la respuesta
   d. Guarda la respuesta JSON en un archivo llamado `{subject}_{model}_result_X.json`

3. Una vez que tengas todos los archivos de resultados:
   a. Abre una nueva conversación con {model.upper()}
   b. Copia el contenido del archivo `{subject}_{model}_combine_instructions.txt`
   c. Pégalo en la interfaz
   d. A continuación, copia y pega el contenido de cada archivo de resultados
   e. Pide al modelo que combine todos los resultados
   f. Guarda el JSON final combinado como `{subject}_final.json`

4. Usa este JSON final para importarlo en tu aplicación o base de datos.

## Notas importantes:

- Asegúrate de que los JSON devueltos por el modelo sean válidos
- Si el modelo da error o no genera JSON válido, intenta dividir la solicitud en lotes más pequeños
- Verifica manualmente algunas preguntas para asegurar su calidad y corrección
""")
    
    logger.info(f"Creado README con instrucciones en {readme_path}")

def main():
    parser = argparse.ArgumentParser(description="Generador de prompts para crear preguntas PAES con LLMs")
    parser.add_argument("--model", type=str, default="gpt", 
                      help="Modelo objetivo (gpt, claude, grok)")
    parser.add_argument("--subject", type=str, 
                      help="Asignatura específica a generar (M1, M2, L, C, H)")
    parser.add_argument("--count", type=int, default=100,
                      help="Número de preguntas a generar por asignatura")
    parser.add_argument("--output", type=str, default=OUTPUT_DIR,
                      help=f"Directorio de salida para los prompts")
    
    args = parser.parse_args()
    
    # Validar el modelo
    if args.model.lower() not in ["gpt", "claude", "grok"]:
        logger.warning(f"Modelo no reconocido: {args.model}. Se usará 'gpt' por defecto.")
        args.model = "gpt"
    
    # Crear directorio de salida
    os.makedirs(args.output, exist_ok=True)
    
    # Cargar temario
    temario = load_temario()
    if not temario:
        logger.error("No se pudo cargar el temario. Abortando.")
        return
    
    # Determinar asignaturas a procesar
    subjects_to_process = [args.subject] if args.subject else SUBJECTS.keys()
    
    # Generar prompts para cada asignatura
    for subject in subjects_to_process:
        if subject in SUBJECTS and subject in temario:
            logger.info(f"Generando prompts para {subject} ({SUBJECTS[subject]['name']})")
            prompts = generate_prompts_for_subject(
                subject=subject,
                temario=temario,
                model=args.model,
                count=args.count
            )
            
            if prompts:
                save_prompts(prompts, subject, args.model, args.output)
                logger.info(f"Completada generación de prompts para {subject}")
            else:
                logger.error(f"No se pudieron generar prompts para {subject}")
        else:
            logger.warning(f"Asignatura no válida o sin datos: {subject}")
    
    logger.info("Proceso completado. Revisa los archivos generados en el directorio de salida.")
    logger.info(f"Directorio de salida: {os.path.abspath(args.output)}")

if __name__ == "__main__":
    main() 