/*
  # Create questions table and indexes

  1. New Tables
    - `questions`
      - `id` (uuid, primary key)
      - `subject` (text) - Subject code (M1, M2, L, C)
      - `content` (text) - Question text
      - `options` (jsonb) - Answer options (a, b, c, d)
      - `correct_answer` (text) - Correct option (a, b, c, d)
      - `explanation` (text) - Explanation of the correct answer
      - `topic` (text) - Specific topic within the subject
      - `difficulty` (integer) - Question difficulty (1-5)
      - `created_at` (timestamp)
      - `active` (boolean) - Whether the question is available for use

  2. Security
    - Enable RLS on questions table
    - Add policies for authenticated users to read questions
    - Only allow admin users to insert/update questions

  3. Indexes
    - Create indexes for frequently queried columns
*/

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  content text NOT NULL,
  options jsonb NOT NULL,
  correct_answer text NOT NULL,
  explanation text NOT NULL,
  topic text,
  difficulty integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  active boolean DEFAULT true,
  CONSTRAINT valid_subject CHECK (subject IN ('M1', 'M2', 'L', 'C')),
  CONSTRAINT valid_difficulty CHECK (difficulty BETWEEN 1 AND 5),
  CONSTRAINT valid_correct_answer CHECK (correct_answer IN ('a', 'b', 'c', 'd'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_active ON questions(active);

-- Enable RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can read active questions"
  ON questions
  FOR SELECT
  USING (active = true);

CREATE POLICY "Only admins can insert questions"
  ON questions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can update questions"
  ON questions
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');