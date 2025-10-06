/*
  # Add History subject and topics

  1. Changes
    - Add 'H' as valid subject
    - Add History topics to topic validation
    - Update indexes and constraints

  2. Topics for History
    - Historia Universal
    - Historia de Chile
    - Geografía
*/

-- First, drop existing constraints
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_subject'
  ) THEN
    ALTER TABLE questions DROP CONSTRAINT valid_subject;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_topic'
  ) THEN
    ALTER TABLE questions DROP CONSTRAINT valid_topic;
  END IF;
END $$;

-- Add new constraints with History subject and topics
ALTER TABLE questions ADD CONSTRAINT valid_subject CHECK (
  subject IN ('M1', 'M2', 'L', 'C', 'H')
);

ALTER TABLE questions ADD CONSTRAINT valid_topic CHECK (
  topic IS NULL OR (
    (subject = 'M1' AND topic IN ('Álgebra', 'Funciones')) OR
    (subject = 'M2' AND topic IN ('Geometría', 'Probabilidad')) OR
    (subject = 'L' AND topic IN ('Gramática', 'Figuras literarias', 'Análisis sintáctico')) OR
    (subject = 'C' AND topic IN ('Biología', 'Química', 'Física')) OR
    (subject = 'H' AND topic IN ('Historia Universal', 'Historia de Chile', 'Geografía'))
  )
);

-- Ensure index exists for topic column
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions (topic);