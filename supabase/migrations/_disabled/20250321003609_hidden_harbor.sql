/*
  # Update subject structure with new hierarchical categories

  1. Changes
    - Add new columns for area_tematica, tema, and subtema
    - Update constraints to match new structure
    - Add indexes for new columns
    - Modify existing topic validation

  2. New Structure
    - Each subject now has:
      - Área Temática (broad category)
      - Tema (specific topic)
      - Subtema (sub-topic)
*/

-- Add new columns
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS area_tematica text,
ADD COLUMN IF NOT EXISTS tema text,
ADD COLUMN IF NOT EXISTS subtema text;

-- Drop existing topic constraint
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_topic'
  ) THEN
    ALTER TABLE questions DROP CONSTRAINT valid_topic;
  END IF;
END $$;

-- Add new constraint for subject and area combinations
ALTER TABLE questions ADD CONSTRAINT valid_subject_structure CHECK (
  (subject = 'M1' AND area_tematica IN (
    'Números',
    'Álgebra y Funciones',
    'Geometría',
    'Probabilidad y Estadística'
  )) OR
  (subject = 'M2' AND area_tematica IN (
    'Números',
    'Álgebra y Funciones',
    'Geometría',
    'Probabilidad y Estadística'
  )) OR
  (subject = 'L' AND area_tematica IN (
    'Localizar',
    'Interpretar',
    'Evaluar'
  )) OR
  (subject = 'C' AND area_tematica IN (
    'Biología',
    'Química',
    'Física'
  )) OR
  (subject = 'H' AND area_tematica IN (
    'Historia Universal',
    'Historia de Chile',
    'Geografía'
  ))
);

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_questions_area_tematica ON questions (area_tematica);
CREATE INDEX IF NOT EXISTS idx_questions_tema ON questions (tema);
CREATE INDEX IF NOT EXISTS idx_questions_subtema ON questions (subtema);

-- Update existing M1 questions
UPDATE questions 
SET 
  area_tematica = CASE
    WHEN topic = 'Álgebra' THEN 'Álgebra y Funciones'
    WHEN topic = 'Funciones' THEN 'Álgebra y Funciones'
    ELSE topic
  END,
  tema = CASE
    WHEN topic = 'Álgebra' THEN 'Expresiones algebraicas'
    WHEN topic = 'Funciones' THEN 'Ecuaciones e inecuaciones de primer grado'
    ELSE NULL
  END
WHERE subject = 'M1';

-- Update existing M2 questions
UPDATE questions 
SET 
  area_tematica = CASE
    WHEN topic = 'Geometría' THEN 'Geometría'
    WHEN topic = 'Probabilidad' THEN 'Probabilidad y Estadística'
    ELSE topic
  END,
  tema = CASE
    WHEN topic = 'Geometría' THEN 'Razones trigonométricas'
    WHEN topic = 'Probabilidad' THEN 'Probabilidad condicional'
    ELSE NULL
  END
WHERE subject = 'M2';

-- Update existing L questions
UPDATE questions 
SET 
  area_tematica = CASE
    WHEN topic = 'Gramática' THEN 'Interpretar'
    WHEN topic = 'Figuras literarias' THEN 'Interpretar'
    WHEN topic = 'Análisis sintáctico' THEN 'Evaluar'
    ELSE topic
  END,
  tema = CASE
    WHEN topic = 'Gramática' THEN 'Relaciones textuales'
    WHEN topic = 'Figuras literarias' THEN 'Significado del texto'
    WHEN topic = 'Análisis sintáctico' THEN 'Crítica del contenido'
    ELSE NULL
  END
WHERE subject = 'L';

-- Update existing C questions
UPDATE questions 
SET 
  area_tematica = topic,
  tema = CASE
    WHEN topic = 'Biología' THEN 'Sistemas biológicos'
    WHEN topic = 'Química' THEN 'Estructura atómica'
    WHEN topic = 'Física' THEN 'Mecánica'
    ELSE NULL
  END
WHERE subject = 'C';

-- Update existing H questions
UPDATE questions 
SET 
  area_tematica = topic,
  tema = CASE
    WHEN topic = 'Historia Universal' THEN 'Edad Contemporánea'
    WHEN topic = 'Historia de Chile' THEN 'Chile en el siglo XIX'
    WHEN topic = 'Geografía' THEN 'Geografía física de Chile'
    ELSE NULL
  END
WHERE subject = 'H';