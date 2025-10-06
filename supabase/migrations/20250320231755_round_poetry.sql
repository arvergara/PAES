/*
  # Update user_sessions constraints

  1. Changes
    - Update valid_subject constraint to include History ('H') as a valid subject
    - Ensure constraint matches the subjects available in the questions table
*/

-- Drop existing constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_subject'
    AND conrelid = 'user_sessions'::regclass
  ) THEN
    ALTER TABLE user_sessions DROP CONSTRAINT valid_subject;
  END IF;
END $$;

-- Add updated constraint including History subject
ALTER TABLE user_sessions ADD CONSTRAINT valid_subject CHECK (
  subject = ANY (ARRAY['M1'::text, 'M2'::text, 'L'::text, 'C'::text, 'H'::text, 'ALL'::text])
);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_subject ON user_sessions (subject);