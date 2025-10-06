/*
  # Create question attempts table

  1. New Tables
    - `question_attempts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `session_id` (uuid, references user_sessions)
      - `question_id` (uuid, references questions)
      - `subject` (text)
      - `mode` (text)
      - `area_tematica` (text)
      - `tema` (text)
      - `subtema` (text)
      - `answer` (text)
      - `is_correct` (boolean)
      - `time_spent` (integer, seconds)
      - `created_at` (timestamp with time zone)

  2. Security
    - Enable RLS on `question_attempts` table
    - Add policies for authenticated users to:
      - Insert their own attempts
      - Read their own attempts
*/

CREATE TABLE IF NOT EXISTS question_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  session_id uuid REFERENCES user_sessions NOT NULL,
  question_id uuid REFERENCES questions NOT NULL,
  subject text NOT NULL,
  mode text NOT NULL,
  area_tematica text,
  tema text,
  subtema text,
  answer text NOT NULL,
  is_correct boolean NOT NULL,
  time_spent integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),

  CONSTRAINT valid_subject CHECK (subject IN ('M1', 'M2', 'L', 'C', 'H', 'ALL')),
  CONSTRAINT valid_mode CHECK (mode IN ('PAES', 'TEST', 'REVIEW')),
  CONSTRAINT valid_answer CHECK (answer IN ('a', 'b', 'c', 'd'))
);

-- Create indexes for better query performance
CREATE INDEX idx_question_attempts_user_id ON question_attempts(user_id);
CREATE INDEX idx_question_attempts_session_id ON question_attempts(session_id);
CREATE INDEX idx_question_attempts_question_id ON question_attempts(question_id);
CREATE INDEX idx_question_attempts_subject ON question_attempts(subject);
CREATE INDEX idx_question_attempts_area_tematica ON question_attempts(area_tematica);
CREATE INDEX idx_question_attempts_created_at ON question_attempts(created_at);

-- Enable RLS
ALTER TABLE question_attempts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can insert own attempts"
  ON question_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own attempts"
  ON question_attempts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);