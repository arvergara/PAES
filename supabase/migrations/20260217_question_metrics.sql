-- ============================================================================
-- Migración: Métricas de preguntas y diferenciación origen
-- Fecha: 2026-02-17
-- ============================================================================

-- 1. Normalizar origen de preguntas existentes (DEMRE/oficiales)
UPDATE questions
SET origen = 'demre-oficial'
WHERE origen IS NULL;

-- 2. Vista: tasa de acierto por pregunta
-- Calcula cuántas veces se respondió cada pregunta y qué % fue correcto
CREATE OR REPLACE VIEW question_stats AS
SELECT
  q.id AS question_id,
  q.subject,
  q.area_tematica,
  q.tema,
  q.subtema,
  q.difficulty,
  q.origen,
  q.active,
  COUNT(qa.id) AS total_attempts,
  COUNT(qa.id) FILTER (WHERE qa.is_correct = true) AS correct_attempts,
  COUNT(qa.id) FILTER (WHERE qa.is_correct = false) AS wrong_attempts,
  CASE
    WHEN COUNT(qa.id) > 0
    THEN ROUND(COUNT(qa.id) FILTER (WHERE qa.is_correct = true)::numeric / COUNT(qa.id), 3)
    ELSE NULL
  END AS success_rate,
  ROUND(AVG(qa.time_spent)::numeric, 1) AS avg_time_seconds,
  -- Dificultad sugerida basada en tasa de acierto real
  -- >80% acierto = fácil (1-2), 50-80% = media (3), <50% = difícil (4-5)
  CASE
    WHEN COUNT(qa.id) < 5 THEN NULL  -- muy pocos datos para sugerir
    WHEN COUNT(qa.id) FILTER (WHERE qa.is_correct = true)::numeric / COUNT(qa.id) >= 0.80 THEN 1
    WHEN COUNT(qa.id) FILTER (WHERE qa.is_correct = true)::numeric / COUNT(qa.id) >= 0.65 THEN 2
    WHEN COUNT(qa.id) FILTER (WHERE qa.is_correct = true)::numeric / COUNT(qa.id) >= 0.50 THEN 3
    WHEN COUNT(qa.id) FILTER (WHERE qa.is_correct = true)::numeric / COUNT(qa.id) >= 0.35 THEN 4
    ELSE 5
  END AS suggested_difficulty
FROM questions q
LEFT JOIN question_attempts qa ON qa.question_id = q.id
GROUP BY q.id, q.subject, q.area_tematica, q.tema, q.subtema,
         q.difficulty, q.origen, q.active;

-- 3. Vista: comparación AI vs DEMRE
CREATE OR REPLACE VIEW origin_comparison AS
SELECT
  origen,
  subject,
  COUNT(*) AS total_questions,
  COUNT(*) FILTER (WHERE active = true) AS active_questions,
  ROUND(AVG(difficulty)::numeric, 1) AS avg_difficulty
FROM questions
GROUP BY origen, subject
ORDER BY subject, origen;

-- 4. RLS para las vistas (heredan de las tablas base)
-- No se necesita RLS adicional porque las vistas usan las mismas políticas

-- 5. Índice para acelerar la consulta de métricas
CREATE INDEX IF NOT EXISTS idx_question_attempts_correct
  ON question_attempts(question_id, is_correct);

COMMENT ON VIEW question_stats IS 'Estadísticas de rendimiento por pregunta: tasa de acierto, tiempo promedio, dificultad sugerida';
COMMENT ON VIEW origin_comparison IS 'Comparación de preguntas por origen (DEMRE vs AI) y asignatura';
