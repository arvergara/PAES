-- ============================================================================
-- PAES Question Bank - Complete Database Setup
-- Project: gmqtbdgkmmlorxeadbih
-- ============================================================================

-- Drop existing table if it exists (WARNING: This will delete all data)
DROP TABLE IF EXISTS questions CASCADE;

-- Create questions table with correct constraints
CREATE TABLE questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic question info
  subject text NOT NULL,
  content text NOT NULL,
  options jsonb NOT NULL,
  correct_answer text NOT NULL,
  explanation text,

  -- Categorization
  area_tematica text,
  tema text,
  subtema text,
  habilidad text,

  -- Metadata
  difficulty integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  active boolean DEFAULT true,

  -- Visual content support
  imagen_url text,
  has_visual_content boolean DEFAULT false,
  images jsonb,

  -- Additional fields
  origen text,
  metadata jsonb DEFAULT '{}',
  tags text[] DEFAULT '{}',
  ai_classification jsonb,
  classification_confidence float,
  processed_at timestamp,
  review_status text DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamp,

  -- Constraints
  CONSTRAINT valid_subject CHECK (subject IN ('M1', 'M2', 'L', 'H', 'C', 'CB', 'CF', 'CQ')),
  CONSTRAINT valid_difficulty CHECK (difficulty BETWEEN 1 AND 5),
  CONSTRAINT valid_correct_answer CHECK (correct_answer IN ('a', 'b', 'c', 'd', 'e'))
);

-- Create indexes for better performance
CREATE INDEX idx_questions_subject ON questions(subject);
CREATE INDEX idx_questions_area_tematica ON questions(area_tematica);
CREATE INDEX idx_questions_tema ON questions(tema);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_active ON questions(active);
CREATE INDEX idx_questions_created_at ON questions(created_at DESC);
CREATE INDEX idx_questions_has_visual ON questions(has_visual_content);

-- Enable Row Level Security (RLS)
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Policy 1: Anyone can read active questions
CREATE POLICY "Anyone can read active questions"
  ON questions
  FOR SELECT
  USING (active = true);

-- Policy 2: Authenticated users can insert (for now - can be restricted later)
CREATE POLICY "Authenticated users can insert questions"
  ON questions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy 3: Authenticated users can update (for now - can be restricted later)
CREATE POLICY "Authenticated users can update questions"
  ON questions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy 4: Service role can do everything (for scripts)
CREATE POLICY "Service role can do anything"
  ON questions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add helpful comments
COMMENT ON TABLE questions IS 'PAES exam questions for all subjects';
COMMENT ON COLUMN questions.subject IS 'Subject code: M1, M2, L, H, C (Biología), CB (Física), CF (Química), CQ';
COMMENT ON COLUMN questions.options IS 'JSON array of answer options with label (a-e) and text';
COMMENT ON COLUMN questions.correct_answer IS 'Correct option label: a, b, c, d, or e';
COMMENT ON COLUMN questions.area_tematica IS 'Main thematic area (e.g., "Álgebra y Funciones", "Historia de Chile")';
COMMENT ON COLUMN questions.tema IS 'Specific topic (e.g., "Ecuaciones", "Edad Contemporánea")';
COMMENT ON COLUMN questions.difficulty IS 'Difficulty level from 1 (easy) to 5 (hard)';

-- ============================================================================
-- Subject Distribution Reference:
--
-- M1 = Matemática 1 (4 alternativas: a, b, c, d)
-- M2 = Matemática 2 (5 alternativas: a, b, c, d, e)
-- L  = Lenguaje (5 alternativas)
-- H  = Historia y Ciencias Sociales (5 alternativas)
-- C  = Ciencias (5 alternativas)
-- CB = Ciencias - Biología
-- CF = Ciencias - Física
-- CQ = Ciencias - Química
-- ============================================================================
