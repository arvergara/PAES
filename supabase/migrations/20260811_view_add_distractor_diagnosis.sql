-- Expone distractor_diagnosis en la vista principal de fetch del frontend
CREATE OR REPLACE VIEW public.questions_with_visuals AS
SELECT id, subject, content, options, correct_answer, explanation,
       area_tematica, tema, subtema, habilidad, difficulty, created_at,
       active, imagen_url, has_visual_content, images, origen, metadata,
       tags, ai_classification, classification_confidence, processed_at,
       review_status, reviewed_by, reviewed_at, reading_id, question_number,
       reading_text_id, image_url, option_images, ref_code,
       distractor_diagnosis
FROM questions;
