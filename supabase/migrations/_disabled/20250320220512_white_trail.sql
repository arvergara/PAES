/*
  # Add question details to user sessions

  1. Changes
    - Add question_details column to user_sessions table to store topic-level data
    - Add indexes for better query performance
    - Update RLS policies

  2. Security
    - Maintain existing RLS policies
    - Add new policy for question details access
*/

-- Add question details column to store topic-level information
ALTER TABLE user_sessions
ADD COLUMN question_details jsonb DEFAULT '[]'::jsonb;

-- Add index for better performance on jsonb queries
CREATE INDEX idx_user_sessions_question_details ON user_sessions USING gin (question_details);

-- Update RLS policies to include new column
CREATE POLICY "Users can read own session details"
  ON user_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);