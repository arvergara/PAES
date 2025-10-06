/*
  # Update questions table for difficulty levels

  1. Changes
    - Add difficulty validation
    - Update indexes for better performance
    - Add constraint for difficulty range

  2. Structure
    - Difficulty levels: 1-5 (1: easiest, 5: hardest)
    - Each subject must have questions across all difficulty levels
*/

-- Ensure difficulty column exists and has proper constraint
DO $$ 
BEGIN
  -- First ensure the column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'difficulty'
  ) THEN
    ALTER TABLE questions ADD COLUMN difficulty integer DEFAULT 1;
  END IF;

  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_difficulty'
    AND conrelid = 'questions'::regclass
  ) THEN
    ALTER TABLE questions DROP CONSTRAINT valid_difficulty;
  END IF;
END $$;

-- Add constraint for difficulty range
ALTER TABLE questions 
ADD CONSTRAINT valid_difficulty 
CHECK (difficulty BETWEEN 1 AND 5);

-- Create index for difficulty
CREATE INDEX IF NOT EXISTS idx_questions_difficulty 
ON questions (difficulty);

-- Create composite index for subject + difficulty
CREATE INDEX IF NOT EXISTS idx_questions_subject_difficulty 
ON questions (subject, difficulty);

-- Update any NULL difficulties to default value
UPDATE questions 
SET difficulty = 1 
WHERE difficulty IS NULL;

-- Make difficulty NOT NULL
ALTER TABLE questions 
ALTER COLUMN difficulty SET NOT NULL;