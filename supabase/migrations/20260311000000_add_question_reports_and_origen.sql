-- Agregar campo origen_tipo a questions para trazabilidad (sin exponer al alumno)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS origen_tipo text DEFAULT 'oficial'
  CHECK (origen_tipo IN ('oficial', 'generada_ia'));

-- Tabla de reportes de preguntas por alumnos
CREATE TABLE IF NOT EXISTS question_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  category text NOT NULL CHECK (category IN (
    'respuesta_incorrecta',   -- La alternativa correcta está mal
    'enunciado_confuso',      -- El enunciado no se entiende
    'opciones_repetidas',     -- Hay opciones duplicadas o muy similares
    'contenido_erroneo',      -- Información factualmente incorrecta
    'imagen_no_carga',        -- Problema con la imagen
    'otro'                    -- Otro problema
  )),
  description text,           -- Descripción libre del problema
  status text DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'revisado', 'corregido', 'descartado')),
  admin_notes text,           -- Notas del admin al revisar
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Índices para question_reports
CREATE INDEX IF NOT EXISTS idx_question_reports_question_id ON question_reports(question_id);
CREATE INDEX IF NOT EXISTS idx_question_reports_status ON question_reports(status);
CREATE INDEX IF NOT EXISTS idx_question_reports_created_at ON question_reports(created_at DESC);

-- RLS para question_reports
ALTER TABLE question_reports ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado puede crear un reporte
CREATE POLICY "Users can create reports" ON question_reports
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden ver sus propios reportes
CREATE POLICY "Users can view own reports" ON question_reports
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Service role tiene acceso completo
CREATE POLICY "Service role full access" ON question_reports
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Vista materializada para estadísticas de dificultad real por pregunta
-- (basada en tasa de respuestas correctas)
CREATE OR REPLACE VIEW question_difficulty_stats AS
SELECT
  q.id AS question_id,
  q.subject,
  q.difficulty AS assigned_difficulty,
  COUNT(qa.id) AS total_attempts,
  SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END) AS correct_attempts,
  CASE
    WHEN COUNT(qa.id) >= 10 THEN
      ROUND(100.0 * SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END) / COUNT(qa.id), 1)
    ELSE NULL
  END AS success_rate,
  CASE
    WHEN COUNT(qa.id) >= 10 THEN
      CASE
        WHEN 100.0 * SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END) / COUNT(qa.id) >= 80 THEN 1
        WHEN 100.0 * SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END) / COUNT(qa.id) >= 60 THEN 2
        WHEN 100.0 * SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END) / COUNT(qa.id) >= 40 THEN 3
        WHEN 100.0 * SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END) / COUNT(qa.id) >= 20 THEN 4
        ELSE 5
      END
    ELSE NULL
  END AS calculated_difficulty
FROM questions q
LEFT JOIN question_attempts qa ON qa.question_id = q.id
GROUP BY q.id, q.subject, q.difficulty;

-- Índice en questions para origen_tipo
CREATE INDEX IF NOT EXISTS idx_questions_origen_tipo ON questions(origen_tipo);
