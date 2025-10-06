# Simulador PAES – Plataforma de Generación y Práctica

Este proyecto implementa el simulador recomendado para producción: front-end en React/Vite conectado a Supabase y un conjunto de scripts Python/Node para procesar PDFs, generar preguntas con IA y clasificar contenido según la taxonomía oficial PAES.

## Requisitos del sistema

- Node.js 18 o superior
- Python 3.10 (se sugiere gestionarlo con `pyenv` o `asdf`)
- Git y Supabase CLI instalados
- Dependencias nativas para OCR:
  - macOS: `brew install tesseract poppler`
  - Ubuntu/Debian: `sudo apt-get install tesseract-ocr tesseract-ocr-spa poppler-utils`
- [Ollama](https://ollama.ai/) si se usarán modelos locales (`ollama pull gemma:7b`)

## Configuración rápida

1. Clona el repositorio y entra a `simulador-paes/project`.
2. Copia la plantilla de variables de entorno:
   ```bash
   cp .env.example .env
   ```
   Actualiza las claves de Supabase y de los proveedores de IA.
3. Instala las dependencias JavaScript:
   ```bash
   npm install
   ```
4. Prepara un entorno Python para los scripts de OCR, clasificación y generación:
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -r scripts/requirements.txt
   ```
   > Si prefieres Poetry puedes reutilizar `../TUPAES/pyproject.toml` para mantener los mismos paquetes fijados.
5. Comprueba que las dependencias nativas estén disponibles:
   ```bash
   tesseract --version
   pdftoppm -version
   ```

## Configuración de Supabase

1. Desde el dashboard copia `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y la `service_role key`.
2. Ejecuta las migraciones del esquema local:
   ```bash
   npm run supabase:migrate
   ```
3. Genera los tipos cuando haya cambios en la base de datos:
   ```bash
   npx supabase gen types typescript --local > src/types/supabase.ts
   ```
4. Si necesitas restablecer la base local utiliza `npx supabase db reset`.

## Scripts principales

| Script | Descripción |
| ------ | ----------- |
| `npm run dev` | Levanta el front-end (Vite) en modo desarrollo |
| `npm run process-pdf -- path/to/file.pdf --subject M2` | Ejecuta OCR, extracción de imágenes y clasificación automática |
| `npm run process-pdf-batch --source data/raw` | Procesa múltiples PDFs en paralelo con resumen y clasificación opcional |
| `npm run import-ocr-results -- output/m2` | Importa uno o varios `preguntas.json` generados previamente |
| `npm run classify-questions` | Clasifica en lotes las preguntas pendientes en Supabase |
| `npm run generate-questions` | Genera preguntas con modelos de IA (OpenAI, Anthropic u Ollama) |
| `npm run test-etl` | Ejecuta pruebas rápidas de normalización de opciones del pipeline OCR |
| `python scripts/generateQManual.py` | Flujo manual para generar prompts aprovechando interfaces externas |

### Parámetros relevantes

Los scripts Node aceptan `--batch`, `--subject`, `--skip` y otros argumentos documentados en cada archivo dentro de `scripts/`.

Los scripts Python admiten banderas como `--generar`, `--complementar`, `--salida` (ver `main_generator.py` y `generateQ.py`).

## Flujos típicos

1. **Procesar PDFs oficiales**
 ```bash
  npm run process-pdf -- content/M2_examples.pdf --subject M2 --auto-classify
  ```
  Genera `output/<pdf>/preguntas.json` con texto, imágenes y tablas asociadas.

   > Para procesar directorios completos usa `npm run process-pdf-batch -- --source content/pdfs --auto-classify`.

2. **Importar a Supabase**
   Usa `scripts/processPdfWithOcr.js` o ejecuta directamente:
   ```bash
   npm run import-ocr-results -- output/M2_examples
   ```
   para cargar los JSON ya generados, incluyendo imágenes y tablas asociadas.

3. **Generar nuevas preguntas con IA**
   ```bash
   npm run generate-questions
   ```
   El comportamiento se controla en `scripts/generateQuestions.js` (modelo, lotes, temperatura…).

4. **Clasificar preguntas pendientes**
 ```bash
  npm run classify-pending
  ```
  Reutiliza el clasificador `TaxonomyClassifier` basado en Transformers para etiquetar áreas, temas y habilidades.
  > También puedes clasificar archivos JSON directamente con `python scripts/classify_batch.py --input preguntas.json --output preguntas_clasificadas.json`.

## Estructura del proyecto

- `src/` – Aplicación React (componentes, hooks, librerías Supabase)
- `scripts/` – Scripts Node y Python para OCR, clasificación, generación y análisis
- `content/` – Temarios y fuentes de referencia
- `supabase/` – Migraciones y utilidades de base de datos
- `output/` – Resultados temporales del procesamiento de PDFs

## Buenas prácticas

- Mantén `.env` fuera del control de versiones. Utiliza la plantilla `.env.example` según el entorno.
- Ejecuta `npm run lint` y las pruebas antes de generar builds o desplegar.
- Usa `npm run test-etl` tras modificar el pipeline OCR/ETL para validar transformaciones básicas.
- Para pipelines Python, reutiliza los módulos de `TUPAES/src` cuando necesites funcionalidades avanzadas (batch processing, ETL a Postgres, etc.).
- Revisa `MIGRATION_PLAN.md` para seguir la ruta de migración desde TUPAES hacia este proyecto.
- Consulta `docs/etl_pipeline.md` para obtener un resumen paso a paso del nuevo flujo OCR → Supabase.

## Soporte

Para dudas técnicas usa los canales del equipo o escribe a `proyectos@alfil.cl`.
