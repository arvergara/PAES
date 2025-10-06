/*
  # Create user sessions table

  1. New Tables
    - `user_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `subject` (text)
      - `mode` (text)
      - `questions_total` (integer)
      - `questions_correct` (integer)
      - `time_spent` (integer, seconds)
      - `created_at` (timestamp with time zone)

  2. Security
    - Enable RLS on `user_sessions` table
    - Add policies for authenticated users to:
      - Insert their own sessions
      - Read their own sessions
*/

CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  subject text NOT NULL,
  mode text NOT NULL,
  questions_total integer NOT NULL DEFAULT 0,
  questions_correct integer NOT NULL DEFAULT 0,
  time_spent integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),

  CONSTRAINT valid_subject CHECK (subject IN ('M1', 'M2', 'L', 'C', 'ALL')),
  CONSTRAINT valid_mode CHECK (mode IN ('PAES', 'TEST', 'REVIEW')),
  CONSTRAINT valid_questions CHECK (questions_correct <= questions_total)
);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own sessions
CREATE POLICY "Users can insert own sessions"
  ON user_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to read their own sessions
CREATE POLICY "Users can read own sessions"
  ON user_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);