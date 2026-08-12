-- Diagnóstico por distractor: {"a": "qué error representa elegir a", ...}
-- Solo alternativas incorrectas; generado offline y validado contra la clave.
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS distractor_diagnosis jsonb;
