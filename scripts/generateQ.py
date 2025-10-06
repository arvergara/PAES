#!/usr/bin/env python3
"""
Generador de preguntas PAES usando OpenAI API (GPT), Claude API (Anthropic) o Grok API (xAI).
Lee contenido de la carpeta content y genera preguntas en formato JSON.
"""

import os
import json
import time
import random
import asyncio
import argparse
from typing import List, Dict, Any, Tuple, Optional
import csv
import anthropic
import openai
from openai import AsyncOpenAI
import logging
from pathlib import Path

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("GeneradorPreguntas")

# Constantes
CONTENT_DIR = "content"
TEMARIO_CSV = "temario.csv"
OUTPUT_FILE = "questions_generated.json"
PREGUNTAS_POR_ASIGNATURA = 100  # Puedes ajustar esto según necesites
CONTEXTO_MAX_TOKENS = 12000      # Aproximadamente el máximo que Claude puede manejar
PREGUNTAS_POR_LOTE = 5           # Cuántas preguntas generar en cada llamada a la API
MAX_RETRIES = 3                  # Máximo de reintentos en caso de error
RETRY_DELAY = 5                  # Segundos de espera entre reintentos

# Asignaturas compatibles con la DB
SUBJECTS = {
    "M1": {"name": "Matemática 1", "content": "M1_content.pdf", "examples": "M1_examples.pdf"},
    "M2": {"name": "Matemática 2", "content": "M2_content.pdf", "examples": "M2_examples.pdf"},
    "L": {"name": "Lenguaje", "content": "L_content.pdf", "examples": "L_examples.pdf"},
    "C": {"name": "Ciencias", "content": "C_content.pdf", "examples": "C_examples.pdf"},
    "H": {"name": "Historia", "content": "H_content.pdf", "examples": "H_examples.pdf"},
}

class QuestionGenerator:
    def __init__(self, api_key: str, model: str = "gpt-4o", provider: str = "openai"):
        """
        Inicializa el generador de preguntas.
        
        Args:
            api_key: API key para el proveedor seleccionado
            model: Modelo a usar (ej. 'gpt-4o', 'claude-3-sonnet', 'claude-3-opus', 'grok-1')
            provider: Proveedor del modelo ('openai', 'anthropic', 'grok')
        """
        self.model = model
        self.provider = provider
        
        if provider == "openai":
            self.client = AsyncOpenAI(api_key=api_key)
        elif provider == "anthropic":
            self.client = anthropic.AsyncAnthropic(api_key=api_key)
        elif provider == "grok":
            # Cuando Grok API esté disponible, implementar su cliente aquí
            raise NotImplementedError("API de Grok aún no implementada")
        else:
            raise ValueError(f"Proveedor no válido: {provider}")
        
        logger.info(f"Inicializado generador con {provider} usando modelo {model}")
        
        # Cargar temario
        self.temario = self._load_temario()
        
    def _load_temario(self) -> Dict[str, Dict]:
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
    
    async def _read_file(self, file_path: str) -> str:
        """Lee un archivo PDF o TXT."""
        try:
            path = Path(file_path)
            
            # Si el archivo es un PDF
            if path.suffix.lower() == '.pdf':
                # Si tienes una librería para leer PDFs directamente, úsala aquí
                # Por simplicidad, buscamos primero una versión en texto
                txt_path = path.with_suffix('.txt')
                if txt_path.exists():
                    with open(txt_path, 'r', encoding='utf-8') as f:
                        return f.read()
                else:
                    logger.warning(f"No se pudo encontrar una versión en texto de {file_path}")
                    # Aquí podrías implementar lectura directa de PDF con PyPDF2, pdf2text, etc.
                    return f"[Contenido del PDF {path.name} - implementar lectura PDF]"
            
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
    
    async def generate_questions_for_subject(self, subject: str, count: int = PREGUNTAS_POR_ASIGNATURA) -> List[Dict]:
        """
        Genera preguntas para una asignatura específica.
        
        Args:
            subject: Código de la asignatura (ej. 'M1', 'C', etc.)
            count: Número de preguntas a generar
            
        Returns:
            Lista de preguntas generadas en formato JSON
        """
        if subject not in SUBJECTS:
            logger.error(f"Asignatura no válida: {subject}")
            return []
            
        if subject not in self.temario:
            logger.error(f"No hay información de temario para {subject}")
            return []
            
        # Leer contenido y ejemplos
        content_path = os.path.join(CONTENT_DIR, SUBJECTS[subject]["content"])
        examples_path = os.path.join(CONTENT_DIR, SUBJECTS[subject]["examples"])
        
        subject_content = await self._read_file(content_path)
        example_questions = await self._read_file(examples_path)
        
        if not subject_content:
            logger.error(f"No se pudo leer el contenido para {subject}")
            return []
            
        # Limitar el contenido si es muy largo
        if len(subject_content) > CONTEXTO_MAX_TOKENS * 4:  # Aproximación: 4 caracteres por token
            subject_content = subject_content[:CONTEXTO_MAX_TOKENS * 4]
            logger.warning(f"Contenido truncado para {subject} debido a limitaciones de tokens")
        
        # Preparar para generación por lotes
        all_questions = []
        questions_generated = 0
        remaining = count
        
        # Obtener temas del temario
        areas = list(self.temario[subject].keys())
        
        while questions_generated < count and areas:
            area = random.choice(areas)
            temas = list(self.temario[subject][area].keys())
            
            if not temas:
                areas.remove(area)
                continue
                
            tema = random.choice(temas)
            subtemas = self.temario[subject][area][tema]
            
            # Si no hay subtemas, usar None
            if not subtemas:
                subtemas = [None]
                
            subtema = random.choice(subtemas)
            
            batch_size = min(PREGUNTAS_POR_LOTE, remaining)
            logger.info(f"Generando {batch_size} preguntas para {subject}: {area} - {tema} - {subtema or 'General'}")
            
            try:
                questions = await self._generate_questions_batch(
                    subject=subject,
                    area=area,
                    tema=tema,
                    subtema=subtema,
                    content=subject_content,
                    examples=example_questions,
                    batch_size=batch_size
                )
                
                if questions:
                    all_questions.extend(questions)
                    questions_generated += len(questions)
                    remaining -= len(questions)
                    logger.info(f"Generadas {len(questions)} preguntas. Total: {questions_generated}/{count}")
                    
                # Esperar un poco entre lotes para evitar límites de rate
                await asyncio.sleep(1)
                
            except Exception as e:
                logger.error(f"Error generando preguntas: {e}")
                # No eliminar el tema/área en caso de error para intentarlo de nuevo
        
        return all_questions
    
    async def _generate_questions_batch(
        self, 
        subject: str,
        area: str,
        tema: str,
        subtema: Optional[str],
        content: str,
        examples: str,
        batch_size: int
    ) -> List[Dict]:
        """
        Genera un lote de preguntas usando el modelo seleccionado.
        """
        # Construir el prompt
        prompt = self._build_prompt(
            subject=subject,
            area_tematica=area,
            tema=tema,
            subtema=subtema,
            content=content,
            examples=examples,
            batch_size=batch_size
        )
        
        # Intentar generar con reintentos
        for attempt in range(MAX_RETRIES):
            try:
                response = await self._call_api(prompt)
                questions = self._parse_response(response, subject, area, tema, subtema)
                
                if questions:
                    return questions
                    
                logger.warning(f"No se pudieron generar preguntas válidas (intento {attempt+1}/{MAX_RETRIES})")
                await asyncio.sleep(RETRY_DELAY)
                
            except Exception as e:
                logger.error(f"Error en intento {attempt+1}/{MAX_RETRIES}: {e}")
                await asyncio.sleep(RETRY_DELAY)
        
        logger.error(f"No se pudieron generar preguntas después de {MAX_RETRIES} intentos")
        return []
    
    def _build_prompt(
        self,
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
        content_excerpt = content[:6000] + ("..." if len(content) > 6000 else "")
        
        return f"""Eres un experto profesor diseñando preguntas para la Prueba de Acceso a la Educación Superior (PAES) chilena en {subject_name}.

Área Temática: {area_tematica}
Tema: {tema}
Subtema: {subtema or "General"}

Referencia de Contenido (usa solo lo relevante para la pregunta):
{content_excerpt}

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

Genera la respuesta en formato JSON EXACTO como un arreglo de objetos con el siguiente esquema:
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

IMPORTANTE: Asegúrate de que el JSON sea válido y que cada pregunta esté matemáticamente correcta. Verifica que las operaciones y cálculos en la explicación sean precisos.
"""
    
    async def _call_api(self, prompt: str) -> str:
        """Llama a la API del proveedor seleccionado."""
        if self.provider == "openai":
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "Eres un experto en educación y matemáticas que genera preguntas precisas para evaluaciones."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"},
                max_tokens=4000
            )
            return response.choices[0].message.content
            
        elif self.provider == "anthropic":
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=4000,
                temperature=0.3,
                system="Eres un experto en educación y matemáticas que genera preguntas precisas para evaluaciones.",
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            return response.content[0].text
        
        # Implementar Grok API cuando esté disponible
            
    def _parse_response(
        self, 
        response: str, 
        subject: str, 
        area: str, 
        tema: str, 
        subtema: Optional[str]
    ) -> List[Dict]:
        """Extrae y valida las preguntas del JSON de respuesta."""
        try:
            # Extraer el JSON si está envuelto en ```
            if "```json" in response:
                json_match = response.split("```json")[1].split("```")[0]
                response = json_match
            elif "```" in response:
                json_match = response.split("```")[1].split("```")[0]
                response = json_match
                
            # Parsear JSON
            data = json.loads(response)
            
            # Convertir a lista si es un objeto
            if isinstance(data, dict):
                if "questions" in data:
                    questions = data["questions"]
                else:
                    questions = [data]
            else:
                questions = data
                
            # Validar cada pregunta
            valid_questions = []
            for q in questions:
                # Validación básica
                if not all([
                    "content" in q and isinstance(q["content"], str),
                    "options" in q and isinstance(q["options"], dict) and len(q["options"]) == 4,
                    "correct_answer" in q and q["correct_answer"].lower() in ["a", "b", "c", "d"],
                    "explanation" in q and isinstance(q["explanation"], str),
                    "difficulty" in q
                ]):
                    continue
                    
                # Normalizar datos
                q["subject"] = subject
                q["area_tematica"] = area
                q["tema"] = tema
                q["subtema"] = subtema or ""
                q["correct_answer"] = q["correct_answer"].lower()
                q["difficulty"] = int(q["difficulty"]) if isinstance(q["difficulty"], str) else q["difficulty"]
                q["difficulty"] = max(1, min(5, q["difficulty"]))  # Asegurar rango 1-5
                q["active"] = True
                
                valid_questions.append(q)
                
            logger.info(f"Preguntas válidas extraídas: {len(valid_questions)} de {len(questions)}")
            return valid_questions
            
        except Exception as e:
            logger.error(f"Error parseando respuesta: {e}")
            logger.debug(f"Respuesta problemática: {response[:200]}...")
            return []
            
    async def generate_all_questions(self, preguntas_por_asignatura: int = PREGUNTAS_POR_ASIGNATURA) -> List[Dict]:
        """Genera preguntas para todas las asignaturas."""
        all_questions = []
        
        for subject in SUBJECTS.keys():
            if subject in self.temario:
                logger.info(f"Generando {preguntas_por_asignatura} preguntas para {subject} ({SUBJECTS[subject]['name']})")
                questions = await self.generate_questions_for_subject(subject, preguntas_por_asignatura)
                all_questions.extend(questions)
                logger.info(f"Completado {subject}: {len(questions)} preguntas generadas")
            else:
                logger.warning(f"No hay datos de temario para {subject}, saltando")
                
        return all_questions

async def main():
    parser = argparse.ArgumentParser(description="Generador de preguntas PAES usando LLMs")
    parser.add_argument("--provider", type=str, default="openai", choices=["openai", "anthropic", "grok"],
                      help="Proveedor de modelo: openai, anthropic o grok")
    parser.add_argument("--model", type=str, 
                      help="Modelo a usar (ej. gpt-4o, claude-3-opus)")
    parser.add_argument("--api-key", type=str, required=True,
                      help="API key para el proveedor")
    parser.add_argument("--output", type=str, default=OUTPUT_FILE,
                      help=f"Archivo de salida (default: {OUTPUT_FILE})")
    parser.add_argument("--subject", type=str, 
                      help="Asignatura específica a generar (M1, M2, L, C, H)")
    parser.add_argument("--count", type=int, default=PREGUNTAS_POR_ASIGNATURA,
                      help=f"Preguntas por asignatura (default: {PREGUNTAS_POR_ASIGNATURA})")
    
    args = parser.parse_args()
    
    # Seleccionar modelo por defecto según proveedor
    if not args.model:
        if args.provider == "openai":
            args.model = "gpt-4o"
        elif args.provider == "anthropic":
            args.model = "claude-3-opus-20240229"
        elif args.provider == "grok":
            args.model = "grok-1"
    
    logger.info(f"Iniciando generación con {args.provider} ({args.model})")
    generator = QuestionGenerator(api_key=args.api_key, model=args.model, provider=args.provider)
    
    start_time = time.time()
    
    if args.subject:
        logger.info(f"Generando {args.count} preguntas para asignatura {args.subject}")
        questions = await generator.generate_questions_for_subject(args.subject, args.count)
    else:
        logger.info(f"Generando {args.count} preguntas por cada asignatura")
        questions = await generator.generate_all_questions(args.count)
    
    # Guardar en formato JSON
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)
    
    elapsed = time.time() - start_time
    logger.info(f"Generación completada: {len(questions)} preguntas en {elapsed:.2f} segundos")
    logger.info(f"Preguntas guardadas en {args.output}")

if __name__ == "__main__":
    asyncio.run(main()) 