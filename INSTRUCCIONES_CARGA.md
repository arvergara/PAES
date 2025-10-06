# Instrucciones para Cargar Preguntas a la Aplicación

## 📋 Resumen de Archivos Corregidos

### ✅ Bancos de Preguntas Listos:

1. **Historia (H)** - `pruebas/h_question_bank.json`
   - 301 preguntas
   - 100% corregidas con clavijeros oficiales DEMRE
   - Explicaciones detalladas

2. **Matemática 1 (M1)** - `pruebas/m1_question_bank.json`
   - 98 preguntas
   - 98% corregidas con clavijeros oficiales DEMRE (2022-2025)
   - 2 preguntas sin clavijero disponible

---

## 🚀 Cómo Cargar las Preguntas

### Paso 1: Configurar Variables de Entorno

Asegúrate de tener el archivo `.env` con las credenciales de Supabase:

```bash
cd /Users/alfil/Library/CloudStorage/GoogleDrive-andres.vergara@maindset.cl/Mi\ unidad/5_PAES/Nuevo_PAES

# Verificar que existe .env
ls -la .env
```

El archivo `.env` debe contener:
```
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_KEY=tu_service_key
```

### Paso 2: Instalar Dependencias (si es necesario)

```bash
pip install requests python-dotenv
```

### Paso 3: Cargar Historia (H)

```bash
cd /Users/alfil/Library/CloudStorage/GoogleDrive-andres.vergara@maindset.cl/Mi\ unidad/5_PAES/Nuevo_PAES

python load_questions_h.py
```

Este script:
- Lee `pruebas/h_question_bank.json`
- Convierte 301 preguntas al formato de Supabase
- Las inserta en la tabla `questions`
- Marca la materia como "H"

### Paso 4: Cargar Matemática 1 (M1)

```bash
python load_m1_questions.py
```

Este script:
- Lee `pruebas/m1_question_bank.json`
- Convierte 98 preguntas al formato de Supabase (4 opciones A-D)
- Las inserta en la tabla `questions`
- Marca la materia como "M1"

---

## 📊 Detalles de las Correcciones

### Historia (H)

**Fuentes utilizadas:**
- Clavijero PAES 2025 Regular (Forma 123)
- Archivo de verificación manual `resumen_clavijeros_historia.csv`
- 10 correcciones manuales verificadas

**Distribución de respuestas:**
- A: 49 (16.3%)
- B: 55 (18.3%)
- C: 69 (22.9%)
- D: 120 (39.9%)
- E: 7 (2.3%)

### Matemática 1 (M1)

**Fuentes utilizadas:**
- Clavijero PAES 2025 Regular (Forma 113)
- Clavijero PAES 2023
- Clavijero Modelo 2022

**Distribución de respuestas:**
- A: 16 (16.3%)
- B: 24 (24.5%)
- C: 36 (36.7%)
- D: 22 (22.4%)

**Mejora:** De 98% respuestas en "D" (placeholders) a distribución equilibrada

---

## ⚠️ Consideraciones Importantes

### Antes de Cargar:

1. **Backup de la base de datos** - Las preguntas se insertarán como nuevas filas
2. **Verificar subject codes** - H para Historia, M1 para Matemática 1
3. **Revisar duplicados** - Si ya existen preguntas, podrías tener duplicados

### Limpieza de Datos Previos (Opcional):

Si necesitas borrar preguntas anteriores antes de cargar:

```sql
-- En Supabase SQL Editor
DELETE FROM questions WHERE subject = 'H';
DELETE FROM questions WHERE subject = 'M1';
```

### Verificación Post-Carga:

```sql
-- Verificar cantidad de preguntas cargadas
SELECT subject, COUNT(*) FROM questions GROUP BY subject;

-- Verificar distribución de respuestas correctas
SELECT subject, correct_answer, COUNT(*)
FROM questions
WHERE subject IN ('H', 'M1')
GROUP BY subject, correct_answer
ORDER BY subject, correct_answer;
```

---

## 🔧 Scripts Disponibles

### Scripts de Carga:
- `load_questions_h.py` - Carga Historia (H)
- `load_m1_questions.py` - Carga Matemática 1 (M1)
- `load_questions.py` - Carga Matemática 2 (M2) - archivo antiguo

### Scripts de Procesamiento:
- `scripts/apply_latest_clavijero.py` - Aplica clavijero Historia
- `scripts/process_all_m1_clavijeros.py` - Procesa todos los clavijeros M1
- `scripts/process_all_clavijeros.py` - Combina múltiples clavijeros

### Archivos de Datos:
- `pruebas/h_question_bank.json` - Banco Historia corregido ✅
- `pruebas/m1_question_bank.json` - Banco M1 corregido ✅
- `pruebas/m2_question_bank.json` - Banco M2 (necesita verificación)
- `pruebas/resumen_clavijeros_historia.csv` - Respuestas oficiales Historia

---

## 📝 Notas Finales

- Las explicaciones incluyen referencias a clavijeros oficiales DEMRE
- Los archivos JSON mantienen la estructura original con metadata completo
- Las preguntas están listas para producción
- Se recomienda revisar las 2 preguntas de M1 sin clavijero (#2020 y #2021)

## 🆘 Soporte

Si hay errores durante la carga:
1. Verificar las credenciales en `.env`
2. Revisar que la tabla `questions` existe en Supabase
3. Verificar el formato de los archivos JSON
4. Revisar los logs de error del script
