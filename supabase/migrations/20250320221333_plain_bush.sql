/*
  # Add topics to questions

  1. Changes
    - Add topic validation to questions table
    - Add index on topic column for better performance
    - Add topic constraints for each subject

  2. Topic Structure
    - M1 (Matemática 1):
      - Álgebra
      - Funciones
    - M2 (Matemática 2):
      - Geometría
      - Probabilidad
    - L (Lenguaje):
      - Gramática
      - Figuras literarias
      - Análisis sintáctico
    - C (Ciencias):
      - Biología
      - Química
      - Física
*/

-- First, ensure topic can be NULL and remove any existing constraint
ALTER TABLE questions DROP CONSTRAINT IF EXISTS valid_topic;
ALTER TABLE questions ALTER COLUMN topic DROP NOT NULL;

-- Add index for topic column
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions (topic);

-- Update existing questions with topics
DO $$ 
BEGIN
  -- M1 questions
  UPDATE questions 
  SET topic = CASE 
    WHEN content LIKE '%función%' OR content LIKE '%f(x)%' OR content LIKE '%gráfico%' THEN 'Funciones'
    ELSE 'Álgebra'
  END
  WHERE subject = 'M1';

  -- M2 questions
  UPDATE questions 
  SET topic = CASE 
    WHEN content LIKE '%probabilidad%' OR content LIKE '%azar%' OR content LIKE '%dado%' OR content LIKE '%moneda%' THEN 'Probabilidad'
    ELSE 'Geometría'
  END
  WHERE subject = 'M2';

  -- L questions
  UPDATE questions 
  SET topic = CASE 
    WHEN content LIKE '%verbo%' OR content LIKE '%sustantivo%' OR content LIKE '%adjetivo%' OR content LIKE '%adverbio%' THEN 'Gramática'
    WHEN content LIKE '%metáfora%' OR content LIKE '%símil%' OR content LIKE '%personificación%' THEN 'Figuras literarias'
    ELSE 'Análisis sintáctico'
  END
  WHERE subject = 'L';

  -- C questions
  UPDATE questions 
  SET topic = CASE 
    WHEN content LIKE '%célula%' OR content LIKE '%ADN%' OR content LIKE '%organismo%' THEN 'Biología'
    WHEN content LIKE '%átomo%' OR content LIKE '%molécula%' OR content LIKE '%enlace%' THEN 'Química'
    ELSE 'Física'
  END
  WHERE subject = 'C';
END $$;

-- Now add the constraint after the data is updated
ALTER TABLE questions ADD CONSTRAINT valid_topic CHECK (
  topic IS NULL OR (
    (subject = 'M1' AND topic IN ('Álgebra', 'Funciones')) OR
    (subject = 'M2' AND topic IN ('Geometría', 'Probabilidad')) OR
    (subject = 'L' AND topic IN ('Gramática', 'Figuras literarias', 'Análisis sintáctico')) OR
    (subject = 'C' AND topic IN ('Biología', 'Química', 'Física'))
  )
);