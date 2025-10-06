/*
  # Update History subject structure

  1. Changes
    - Add detailed structure for Historia subject
    - Define areas temáticas, temas and subtemas
    - Update existing questions with proper categorization

  2. Structure
    - Historia Universal
      - Edad Contemporánea
      - Totalitarismos y Guerra Mundial
      - Nuevo Orden Mundial
    - Historia de Chile
      - Chile en el siglo XIX
      - Formación de la República
      - Inserción Internacional
    - Geografía
      - Geografía física de Chile
      - Recursos naturales
      - Desarrollo económico
*/

-- Update History questions with proper structure
UPDATE questions 
SET 
  area_tematica = CASE
    WHEN content LIKE '%mundial%' OR content LIKE '%guerra%' OR content LIKE '%revolución%' OR content LIKE '%Europa%' THEN 'Historia Universal'
    WHEN content LIKE '%Chile%' OR content LIKE '%nacional%' OR content LIKE '%república%' THEN 'Historia de Chile'
    ELSE 'Geografía'
  END,
  tema = CASE
    -- Historia Universal
    WHEN content LIKE '%revolución%' OR content LIKE '%liberal%' OR content LIKE '%siglo XIX%' THEN 'Edad Contemporánea'
    WHEN content LIKE '%guerra mundial%' OR content LIKE '%totalitarismo%' OR content LIKE '%fascismo%' THEN 'Totalitarismos y Guerra Mundial'
    WHEN content LIKE '%guerra fría%' OR content LIKE '%globalización%' OR content LIKE '%orden mundial%' THEN 'Nuevo Orden Mundial'
    -- Historia de Chile
    WHEN content LIKE '%Chile%' AND (content LIKE '%XIX%' OR content LIKE '%república%') THEN 'Chile en el siglo XIX'
    WHEN content LIKE '%organización%' OR content LIKE '%constitución%' OR content LIKE '%estado%' THEN 'Formación de la República'
    WHEN content LIKE '%internacional%' OR content LIKE '%comercio%' OR content LIKE '%relaciones%' THEN 'Inserción Internacional'
    -- Geografía
    WHEN content LIKE '%relieve%' OR content LIKE '%clima%' OR content LIKE '%región%' THEN 'Geografía física de Chile'
    WHEN content LIKE '%recursos%' OR content LIKE '%minería%' OR content LIKE '%naturales%' THEN 'Recursos naturales'
    WHEN content LIKE '%desarrollo%' OR content LIKE '%economía%' OR content LIKE '%producción%' THEN 'Desarrollo económico'
    ELSE NULL
  END,
  subtema = CASE
    -- Historia Universal
    WHEN content LIKE '%ideas%' OR content LIKE '%liberal%' THEN 'Ideas republicanas y liberales en América y Europa'
    WHEN content LIKE '%estado nación%' THEN 'Impacto del Estado nación en América y Europa'
    -- Historia de Chile
    WHEN content LIKE '%organización%' AND content LIKE '%república%' THEN 'Formación y organización de la República'
    WHEN content LIKE '%internacional%' AND content LIKE '%Chile%' THEN 'Inserción de la economía chilena en mercados internacionales'
    WHEN content LIKE '%totalitarismo%' OR content LIKE '%fascismo%' THEN 'Totalitarismos europeos y populismo en América Latina'
    WHEN content LIKE '%guerra mundial%' AND content LIKE '%orden%' THEN 'Configuración del orden mundial posterior a la Segunda Guerra Mundial'
    WHEN content LIKE '%militar%' OR content LIKE '%dictadura%' THEN 'Dictadura Militar en Chile y retorno a la democracia'
    -- Sociedad democrática
    WHEN content LIKE '%democracia%' AND content LIKE '%fundamentos%' THEN 'Fundamentos y atributos de la democracia'
    WHEN content LIKE '%democracia%' AND content LIKE '%instituciones%' THEN 'Institucionalidad democrática en Chile'
    WHEN content LIKE '%democracia%' AND content LIKE '%interés%' THEN 'Interés de la ciudadanía en la democracia'
    -- Sistema económico
    WHEN content LIKE '%mercado%' OR content LIKE '%económico%' THEN 'Factores que afectan el mercado y su funcionamiento'
    ELSE NULL
  END
WHERE subject = 'H';

-- Add constraint to validate Historia structure
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_subject_structure'
    AND conrelid = 'questions'::regclass
  ) THEN
    ALTER TABLE questions DROP CONSTRAINT valid_subject_structure;
  END IF;
END $$;

ALTER TABLE questions ADD CONSTRAINT valid_subject_structure CHECK (
  (subject = 'H' AND area_tematica IN (
    'Historia Universal',
    'Historia de Chile',
    'Geografía'
  ) AND tema IN (
    'Edad Contemporánea',
    'Totalitarismos y Guerra Mundial',
    'Nuevo Orden Mundial',
    'Chile en el siglo XIX',
    'Formación de la República',
    'Inserción Internacional',
    'Geografía física de Chile',
    'Recursos naturales',
    'Desarrollo económico'
  )) OR
  (subject != 'H')
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_questions_h_area_tematica ON questions (area_tematica) WHERE subject = 'H';
CREATE INDEX IF NOT EXISTS idx_questions_h_tema ON questions (tema) WHERE subject = 'H';
CREATE INDEX IF NOT EXISTS idx_questions_h_subtema ON questions (subtema) WHERE subject = 'H';