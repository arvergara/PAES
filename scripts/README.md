# Sistema de Generación de Preguntas PAES

Este repositorio contiene scripts para generar preguntas tipo PAES (Prueba de Acceso a la Educación Superior) para el simulador PAES. Hay dos enfoques disponibles:

## 1. Generación con APIs (generateQ.py)

Genera preguntas PAES utilizando APIs de OpenAI o Anthropic.

### Uso básico:

```bash
python generateQ.py --subject=M1 --count=100 --api=openai
```

### Ventajas:

- Automatización completa
- Mayor velocidad de generación
- Procesamiento por lotes

### Requisitos:

- Claves de API (OpenAI o Anthropic)
- Instalar dependencias: `pip install -r requirements.txt`

## 2. Generación Manual (generateQManual.py)

Genera prompts para usar directamente en interfaces web como ChatGPT, Claude o Grok.

### Uso básico:

```bash
python generateQManual.py --model=gpt --subject=M1 --count=100
```

### Ventajas:

- No requiere claves de API
- Acceso a los modelos más recientes
- Control manual del proceso
- Sin costos de API

### Más información:

Ver [README_manual.md](README_manual.md) para instrucciones detalladas.

## Scripts auxiliares

### Proceso OCR + Clasificación

- **`node processPdfWithOcr.js`**: ejecuta el pipeline extremo-a-extremo para un PDF.

  ```bash
  node processPdfWithOcr.js ../pruebas/M2-2024-1.pdf --subject M2 --skip 2 --auto-classify
  ```

  Parámetros útiles:
  - `--auto-classify`: aplica zero-shot durante el mismo proceso
  - `--temario`, `--model`, `--device`: personalizan el clasificador Python
  - `--no-import`: salta la carga a Supabase y deja los JSON en `output/`

- **`python ocr/batch_runner.py`**: adapta el `batch_pipeline` de TUPAES para procesar múltiples PDFs en paralelo.

  ```bash
  python scripts/ocr/batch_runner.py --source data/raw --auto-classify --jobs 4 --export-summary output/resumen.json
  ```

- **`python classify_batch.py`**: clasifica archivos JSON/JSONL existentes sin pasar por Supabase.

  ```bash
  python scripts/classify_batch.py --input output/M2_examples/preguntas.json --subject M2 --output output/M2_examples/preguntas_clasificadas.json
  ```

- **`npm run test-etl`**: ejecuta pruebas de humo para la normalización de alternativas del pipeline OCR.

### Otros utilitarios

- **`extractPdfContent.py`**: extrae texto plano desde PDFs y genera archivos de referencia.

  ```bash
  python extractPdfContent.py --input=content/M1_content.pdf
  ```

- **`convertPAESPDFs.py`**: transforma lotes de PDFs oficiales en JSON de ejemplo.

- **`migrateToSupabase.py`**: importa bancos de preguntas generados manualmente.

## Flujo de trabajo recomendado

1. **Preparar contenido**:

   - Coloca archivos PDF de contenido en `content/`
   - Extrae el texto con `extractPdfContent.py`

2. **Preparar ejemplos**:

   - Coloca PDFs de pruebas PAES en `pruebas/`
   - Procésalos con `convertPAESPDFs.py`

3. **Generar preguntas**:

   - Con API: `generateQ.py`
   - Sin API: `generateQManual.py`

4. **Migrar a la base de datos**:
   - Usa `migrateToSupabase.py`

## Requisitos comunes

Para todos los scripts:

```
pip install pypdf python-dotenv
```

Para la generación con API:

```
pip install openai anthropic
```

Para la migración a Supabase:

```
pip install supabase
```
