-- Migración para agregar soporte de contenido visual (imágenes y tablas)
-- ============================================================

-- 1. Agregar campos a la tabla questions para soporte de imágenes
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS has_visual_content BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS visual_elements TEXT[] DEFAULT '{}';

-- 2. Agregar campos para clasificación automática
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS ai_classification JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS classification_confidence FLOAT,
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS processing_status VARCHAR(50) DEFAULT 'pending';

-- 3. Crear tabla para almacenar información detallada de imágenes
CREATE TABLE IF NOT EXISTS question_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_path TEXT,
  image_type VARCHAR(50) DEFAULT 'diagram', -- diagram, graph, table, icon, other
  coordinates JSONB, -- Coordenadas en el PDF original
  page_number INTEGER,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Crear tabla para almacenar tablas extraídas
CREATE TABLE IF NOT EXISTS question_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  table_content JSONB NOT NULL, -- Contenido de la tabla en formato JSON
  page_number INTEGER,
  rows INTEGER,
  cols INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_questions_has_visual ON questions(has_visual_content);
CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(processing_status);
CREATE INDEX IF NOT EXISTS idx_questions_subject_visual ON questions(subject, has_visual_content);
CREATE INDEX IF NOT EXISTS idx_question_images_question ON question_images(question_id);
CREATE INDEX IF NOT EXISTS idx_question_tables_question ON question_tables(question_id);

-- 6. Crear vista para preguntas con contenido visual
CREATE OR REPLACE VIEW questions_with_visuals AS
SELECT 
  q.*,
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'id', qi.id,
        'url', qi.image_url,
        'type', qi.image_type,
        'width', qi.width,
        'height', qi.height
      )
    ) FILTER (WHERE qi.id IS NOT NULL), 
    '[]'::json
  ) AS image_details,
  COUNT(DISTINCT qi.id) AS image_count,
  COUNT(DISTINCT qt.id) AS table_count
FROM questions q
LEFT JOIN question_images qi ON q.id = qi.question_id
LEFT JOIN question_tables qt ON q.id = qt.question_id
GROUP BY q.id;

-- 7. Función para actualizar el campo has_visual_content automáticamente
CREATE OR REPLACE FUNCTION update_has_visual_content()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE questions 
  SET has_visual_content = TRUE 
  WHERE id = NEW.question_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Triggers para mantener has_visual_content actualizado
CREATE TRIGGER update_visual_content_on_image_insert
AFTER INSERT ON question_images
FOR EACH ROW
EXECUTE FUNCTION update_has_visual_content();

CREATE TRIGGER update_visual_content_on_table_insert
AFTER INSERT ON question_tables
FOR EACH ROW
EXECUTE FUNCTION update_has_visual_content();

-- 9. Función para limpiar visual_content cuando se eliminan todas las imágenes/tablas
CREATE OR REPLACE FUNCTION check_visual_content_on_delete()
RETURNS TRIGGER AS $$
DECLARE
  image_count INTEGER;
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO image_count 
  FROM question_images 
  WHERE question_id = OLD.question_id;
  
  SELECT COUNT(*) INTO table_count 
  FROM question_tables 
  WHERE question_id = OLD.question_id;
  
  IF image_count = 0 AND table_count = 0 THEN
    UPDATE questions 
    SET has_visual_content = FALSE 
    WHERE id = OLD.question_id;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 10. Triggers para actualizar has_visual_content en eliminación
CREATE TRIGGER check_visual_content_on_image_delete
AFTER DELETE ON question_images
FOR EACH ROW
EXECUTE FUNCTION check_visual_content_on_delete();

CREATE TRIGGER check_visual_content_on_table_delete
AFTER DELETE ON question_tables
FOR EACH ROW
EXECUTE FUNCTION check_visual_content_on_delete();

-- 11. Comentarios para documentación
COMMENT ON TABLE question_images IS 'Almacena imágenes asociadas a preguntas PAES';
COMMENT ON TABLE question_tables IS 'Almacena tablas extraídas asociadas a preguntas PAES';
COMMENT ON COLUMN questions.has_visual_content IS 'Indica si la pregunta tiene imágenes o tablas asociadas';
COMMENT ON COLUMN questions.images IS 'Array JSON con referencias a imágenes (retrocompatibilidad)';
COMMENT ON COLUMN questions.ai_classification IS 'Clasificación automática generada por IA';
COMMENT ON COLUMN questions.processing_status IS 'Estado del procesamiento: pending, processing, classified, completed, error';