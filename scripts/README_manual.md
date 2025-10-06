# Generador de Prompts para Preguntas PAES sin API

Este script genera prompts que puedes usar directamente en las interfaces web de ChatGPT, Claude o Grok para crear preguntas PAES sin necesidad de usar APIs ni claves.

## Ventajas de este enfoque

1. **Sin costo de API**: Utiliza tu suscripción existente a ChatGPT, Claude o Grok.
2. **Control manual**: Puedes revisar cada prompt y resultado antes de continuar.
3. **Flexibilidad**: Puedes ajustar las instrucciones mientras interactúas con el modelo.
4. **Acceso a modelos más recientes**: Usa las últimas versiones de GPT-4o, Claude 3 Opus o Grok sin esperar por acceso a la API.

## Requisitos

1. Python 3.7 o superior
2. Acceso a ChatGPT, Claude o Grok (suscripción o versión gratuita)
3. Los archivos de contenido en la carpeta `content/`

## Uso del script

### Generar prompts para todas las asignaturas con GPT:

```bash
python generateQManual.py
```

### Generar prompts para una asignatura específica con Claude:

```bash
python generateQManual.py --model=claude --subject=M1 --count=50
```

### Otros parámetros:

- `--model`: Especifica el modelo objetivo (`gpt`, `claude` o `grok`)
- `--count`: Número de preguntas a generar por asignatura (predeterminado: 100)
- `--output`: Directorio donde se guardarán los prompts generados (predeterminado: "prompts")

## Proceso completo

1. **Generación de prompts**:

   - El script lee los contenidos de los PDFs y el temario
   - Genera múltiples prompts distribuidos por temas
   - Los guarda en archivos de texto en la carpeta `prompts/[asignatura]`

2. **Usar los prompts con el modelo**:

   - Sigue las instrucciones en el README.md generado en cada carpeta de asignatura
   - Copia cada prompt en la interfaz web del modelo
   - Guarda las respuestas JSON

3. **Combinar resultados**:

   - Usa las instrucciones de combinación para unir todos los JSON
   - Guarda el resultado final como `[asignatura]_final.json`

4. **Importar a Supabase**:
   - Usa el script `migrateToSupabase.py` para subir el JSON a la base de datos

## Estructura de directorios

```
prompts/
  ├── M1/                             # Carpeta de Matemática 1
  │   ├── M1_gpt_prompt_1.txt         # Primer prompt para GPT
  │   ├── M1_gpt_prompt_2.txt         # Segundo prompt para GPT
  │   ├── ...
  │   ├── M1_gpt_combine_instructions.txt  # Instrucciones para combinar
  │   └── README.md                   # Instrucciones para la asignatura
  ├── M2/                             # Carpeta de Matemática 2
  │   ├── ...
  ├── ...
```

## Consejos

- Si el modelo genera errores o no devuelve un JSON válido, intenta reducir el tamaño del prompt
- Revisa manualmente algunas preguntas para asegurar su calidad
- Para generar cientos de preguntas, divide el trabajo en varias sesiones
