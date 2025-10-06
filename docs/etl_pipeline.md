# Pipeline OCR → Clasificación → Supabase

Este documento resume el flujo actualizado para llevar PDFs PAES a la base de datos productiva.

## 1. Procesamiento de PDFs

| Opción | Uso | Comentario |
| ------ | --- | ---------- |
| `npm run process-pdf -- <pdf>` | Procesa un único archivo con OCR, imágenes y tablas | Usa `--auto-classify` para etiquetar en la misma ejecución |
| `npm run process-pdf-batch -- --source <carpeta>` | Procesa múltiples archivos en paralelo | Implementa inferencia automática de materia por nombre de archivo |
| `python scripts/ocr/batch_runner.py` | Alternativa directa en Python con más banderas | Admite `--jobs`, `--export-summary` y configuración de modelo Hugging Face |

El resultado reside en `output/<nombre_pdf>/preguntas.json` e incluye:

- `questions`: enunciado, alternativas normalizadas (`a`-`e`), indicadores visuales y clasificación opcional
- `images`: metadatos de cada recurso extraído (id, tipo, coordenadas)
- `tables`: tablas identificadas mediante `pdfplumber`
- `metadata`: información del proceso (materia, páginas omitidas, auto_classified)

## 2. Importación a Supabase

| Opción | Uso | Comentario |
| ------ | --- | ---------- |
| `npm run process-pdf ...` | Importa inmediatamente después del OCR | Ideal para cargas individuales |
| `npm run import-ocr-results -- output/M2_examples` | Lee `preguntas.json` existentes y los sube | Perfecto para pipelines batch o entornos CI |

Durante la importación se ejecutan los siguientes pasos:

1. Inserción en `questions`, rellenando `ai_classification`, `classification_confidence`, `metadata` y `has_visual_content`.
2. Carga de imágenes en el bucket `question-images` y registro en `question_images` con URL pública.
3. Inserción de tablas en `question_tables` y actualización de `has_visual_content`.
4. Registro de errores y métricas (`questionsImported`, `imagesUploaded`, `tablesImported`).

> Si el JSON ya contiene `ai_classification`, no se ejecuta nuevamente el clasificador Node/Python; se respeta la metadata original.

## 3. Clasificación independiente

- `npm run classify-questions`: trabaja directamente contra Supabase para preguntas pendientes (`processing_status = pending`).
- `python scripts/classify_batch.py`: admite archivos JSON/JSONL externos y permite escribir los resultados en `--output` (`json` o `jsonl`).

## 4. Recomendaciones operativas

- Ejecuta `pip install -r scripts/requirements.txt` en el mismo entorno virtual utilizado por los scripts Python.
- Mantén actualizado el bucket `question-images` y sus políticas de RLS según las migraciones `20250709*`.
- Agrega pruebas de humo después de cada importación (por ejemplo, `npm run test-classification`) para validar que la data quedó consistente.
- Corre `npm run test-etl` cuando hagas cambios en `processPdfWithOcr.js` para asegurarte de que la normalización de alternativas sigue funcionando.
- Para pipelines CI/CD, combina `process-pdf-batch` + `import-ocr-results` con `--export-summary` y adjunta el resumen como artefacto.

## 5. Troubleshooting rápido

| Problema | Posible causa | Acciones |
| -------- | ------------- | -------- |
| `Proceso OCR falló con código 1` | Dependencias nativas (Tesseract/Poppler) ausentes | Verifica instalación del sistema y variables de entorno `TESSERACT_CMD`, `POPPLER_PATH` |
| Clasificación lenta | Uso de CPU para modelos Transformers | Ejecuta con `--device 0` si hay GPU disponible o reduce `jobs` |
| Imágenes sin URL pública | Falta configurar bucket `question-images` como público | Revisa migraciones `20250709...` y panel de Supabase |
| Opciones de respuesta en formato incorrecto | JSON de origen sin sufijo `A)`, `B)` | Usa `normalizeOptions` o ajusta manualmente el JSON antes de importar |

Mantén este flujo como referencia para la migración desde TUPAES y para nuevos miembros del equipo.
