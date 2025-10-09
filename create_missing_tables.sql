-- Create missing tables for PAES application

-- 1. user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  subject text NOT NULL,
  mode text NOT NULL,
  questions_total integer NOT NULL DEFAULT 0,
  questions_correct integer NOT NULL DEFAULT 0,
  time_spent integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),

  CONSTRAINT valid_subject CHECK (subject = ANY (ARRAY['M1'::text, 'M2'::text, 'L'::text, 'C'::text, 'H'::text, 'CB'::text, 'CF'::text, 'CQ'::text, 'ALL'::text])),
  CONSTRAINT valid_mode CHECK (mode IN ('PAES', 'TEST', 'REVIEW')),
  CONSTRAINT valid_questions CHECK (questions_correct <= questions_total)
);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own sessions"
  ON user_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own sessions"
  ON user_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_subject ON user_sessions (subject);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions (user_id);

-- 2. user_answers table
CREATE TABLE IF NOT EXISTS user_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  question_id uuid REFERENCES questions(id) NOT NULL,
  user_answer text NOT NULL,
  is_correct boolean NOT NULL,
  time_spent integer,
  created_at timestamptz DEFAULT now(),

  CONSTRAINT valid_user_answer CHECK (user_answer IN ('a', 'b', 'c', 'd', 'e'))
);

ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own answers"
  ON user_answers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own answers"
  ON user_answers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_answers_user_id ON user_answers (user_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_question_id ON user_answers (question_id);

-- 3. profiles table (for user metadata)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Grant access
GRANT SELECT ON user_sessions TO anon, authenticated;
GRANT INSERT ON user_sessions TO authenticated;
GRANT SELECT ON user_answers TO anon, authenticated;
GRANT INSERT ON user_answers TO authenticated;
GRANT SELECT ON profiles TO authenticated;
GRANT UPDATE ON profiles TO authenticated;
