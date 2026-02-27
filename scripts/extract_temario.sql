-- Temario por materia
SELECT 
  subject,
  area_tematica,
  tema,
  subtema,
  COUNT(*) as num_preguntas,
  ROUND(AVG(difficulty), 1) as dificultad_promedio
FROM questions
WHERE active = true
GROUP BY subject, area_tematica, tema, subtema
ORDER BY subject, area_tematica, tema, subtema;
