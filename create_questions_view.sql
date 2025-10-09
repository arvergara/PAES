-- Create the questions_with_visuals view that the frontend expects
-- This view extends the questions table with computed visual content fields

CREATE OR REPLACE VIEW questions_with_visuals AS
SELECT
  q.id,
  q.subject,
  q.content,
  q.options,
  q.correct_answer,
  q.explanation,
  q.area_tematica,
  q.tema,
  q.subtema,
  q.difficulty,
  q.habilidad,
  q.active,
  q.created_at,
  q.imagen_url,
  q.origen,
  q.tags,
  q.metadata,
  -- Visual content fields with defaults
  COALESCE(q.has_visual_content, false) as has_visual_content,
  COALESCE(q.images, '[]'::jsonb) as images,
  COALESCE(q.images, '[]'::jsonb) as image_details,
  CASE
    WHEN q.images IS NULL THEN 0
    ELSE jsonb_array_length(q.images)
  END as image_count,
  0 as table_count
FROM questions q;

-- Grant access to anonymous users (for reading)
GRANT SELECT ON questions_with_visuals TO anon;
GRANT SELECT ON questions_with_visuals TO authenticated;

-- Add comment
COMMENT ON VIEW questions_with_visuals IS 'Extended view of questions with visual content metadata';
