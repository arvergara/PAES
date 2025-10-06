# Generador de Preguntas PAES con LLMs

Este script Python genera preguntas para la Prueba de Acceso a la Educación Superior (PAES) chilena usando modelos de lenguaje como GPT-4o (OpenAI) o Claude (Anthropic).

## Requisitos

1. Python 3.7 o superior
2. Las bibliotecas listadas en `requirements.txt`
3. API key de OpenAI o Anthropic

## Instalación

```bash
pip install -r requirements.txt
```

## Uso

El script puede ejecutarse de diferentes maneras según tus necesidades:

### Generar preguntas para todas las asignaturas usando GPT-4o (OpenAI):

```bash
python generateQ.py --api-key="tu_api_key_de_openai"
```

### Generar preguntas con Claude:

```bash
python generateQ.py --provider="anthropic" --api-key="tu_api_key_de_anthropic"
```

### Generar preguntas solo para una asignatura específica:

```bash
python generateQ.py --api-key="tu_api_key" --subject="M1" --count=20
```

### Otros parámetros:

- `--model`: Especifica un modelo exacto (ej. "gpt-4-turbo", "claude-3-opus-20240229")
- `--output`: Cambia el nombre del archivo de salida (predeterminado: "questions_generated.json")

## Formato del JSON generado

Las preguntas se generan en un formato JSON que es compatible con la base de datos del simulador:

```json
[
  {
    "content": "Texto completo de la pregunta...",
    "options": {
      "a": "Primera opción",
      "b": "Segunda opción",
      "c": "Tercera opción",
      "d": "Cuarta opción"
    },
    "correct_answer": "a",
    "explanation": "Explicación detallada...",
    "subject": "M1",
    "area_tematica": "Álgebra",
    "tema": "Ecuaciones",
    "subtema": "Ecuaciones de primer grado",
    "difficulty": 3,
    "active": true
  }
  // Más preguntas...
]
```

## Soporte de asignaturas

El script soporta las siguientes asignaturas:

- M1: Matemática 1
- M2: Matemática 2
- L: Lenguaje
- C: Ciencias
- H: Historia

## Migración a Supabase

Para migrar las preguntas generadas a Supabase, puedes usar el script `migrateToSupabase.py` (crear si es necesario).
