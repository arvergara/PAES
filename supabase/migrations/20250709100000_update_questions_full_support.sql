-- Actualización completa de la tabla questions para soporte de todas las materias e imágenes
-- ======================================================================================

-- 1. Actualizar constraint de materias para incluir todas las del PAES
ALTER TABLE questions 
DROP CONSTRAINT IF EXISTS valid_subject;

ALTER TABLE questions 
ADD CONSTRAINT valid_subject 
CHECK (subject IN ('M1', 'M2', 'L', 'C', 'H', 'CB', 'CF', 'CQ', 'ALL'));

-- 2. Agregar campos faltantes de las migraciones anteriores si no existen
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS area_tematica text,
ADD COLUMN IF NOT EXISTS tema text,
ADD COLUMN IF NOT EXISTS subtema text,
ADD COLUMN IF NOT EXISTS habilidad text;

-- 3. Agregar soporte para contenido visual (de la migración anterior)
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS has_visual_content BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS visual_elements TEXT[] DEFAULT '{}';

-- 4. Agregar campos para clasificación automática
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS ai_classification JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS classification_confidence FLOAT,
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS processing_status VARCHAR(50) DEFAULT 'pending';

-- 5. Agregar campo metadata para información adicional
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 6. Crear tabla para almacenar información detallada de imágenes
CREATE TABLE IF NOT EXISTS question_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_path TEXT,
  image_type VARCHAR(50) DEFAULT 'diagram',
  coordinates JSONB,
  page_number INTEGER,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 7. Crear bucket de storage para imágenes (esto se debe hacer en el dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('question-images', 'question-images', true);

-- 8. Actualizar políticas RLS para permitir lectura pública
DROP POLICY IF EXISTS "Anyone can read active questions" ON questions;

CREATE POLICY "Public read access to questions"
  ON questions
  FOR SELECT
  USING (true);

-- 9. Crear política temporal para permitir inserción sin autenticación (SOLO PARA DESARROLLO)
CREATE POLICY "Temporary allow inserts"
  ON questions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Temporary allow updates"
  ON questions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 10. Políticas para question_images
ALTER TABLE question_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to question images"
  ON question_images
  FOR SELECT
  USING (true);

CREATE POLICY "Temporary allow image inserts"
  ON question_images
  FOR INSERT
  WITH CHECK (true);

-- 11. Crear índices adicionales
CREATE INDEX IF NOT EXISTS idx_questions_area_tematica ON questions(area_tematica);
CREATE INDEX IF NOT EXISTS idx_questions_tema ON questions(tema);
CREATE INDEX IF NOT EXISTS idx_questions_has_visual ON questions(has_visual_content);
CREATE INDEX IF NOT EXISTS idx_questions_processing_status ON questions(processing_status);

-- 12. Comentarios para documentación
COMMENT ON COLUMN questions.area_tematica IS 'Área temática según temario PAES';
COMMENT ON COLUMN questions.tema IS 'Tema específico dentro del área temática';
COMMENT ON COLUMN questions.habilidad IS 'Habilidad evaluada: Resolver problemas, Modelar, Representar, etc.';
COMMENT ON COLUMN questions.has_visual_content IS 'Indica si la pregunta tiene imágenes o tablas asociadas';
COMMENT ON COLUMN questions.ai_classification IS 'Clasificación automática generada por IA';
COMMENT ON COLUMN questions.metadata IS 'Información adicional como fuente del PDF, página, etc.';