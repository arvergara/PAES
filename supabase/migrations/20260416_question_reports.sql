-- ============================================================================
-- Migración: alinear question_reports al schema usado por el frontend
-- Fecha: 2026-04-16
-- Preserva registros existentes traduciendo valores del schema viejo
-- (category/description/admin_notes/resolved_at + status en español) al
-- schema nuevo (reason/details/resolution_note/reviewed_at + status en
-- inglés). Idempotente: soporta tablas ya migradas o instalación limpia.
-- ============================================================================

-- Tabla base (solo cubre instalación limpia)
CREATE TABLE IF NOT EXISTS question_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 1) Drop check constraints viejos (bloquean rename/translation)
ALTER TABLE question_reports DROP CONSTRAINT IF EXISTS question_reports_category_check;
ALTER TABLE question_reports DROP CONSTRAINT IF EXISTS question_reports_status_check;
ALTER TABLE question_reports DROP CONSTRAINT IF EXISTS valid_reason;
ALTER TABLE question_reports DROP CONSTRAINT IF EXISTS valid_status;

-- 2) Rename columnas del schema viejo si todavía existen
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='question_reports' AND column_name='category') THEN
    ALTER TABLE question_reports RENAME COLUMN category TO reason;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='question_reports' AND column_name='description') THEN
    ALTER TABLE question_reports RENAME COLUMN description TO details;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='question_reports' AND column_name='admin_notes') THEN
    ALTER TABLE question_reports RENAME COLUMN admin_notes TO resolution_note;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='question_reports' AND column_name='resolved_at') THEN
    ALTER TABLE question_reports RENAME COLUMN resolved_at TO reviewed_at;
  END IF;
END $$;

-- 3) Agregar columnas del schema nuevo si faltan
ALTER TABLE question_reports ADD COLUMN IF NOT EXISTS reason text;
ALTER TABLE question_reports ADD COLUMN IF NOT EXISTS details text;
ALTER TABLE question_reports ADD COLUMN IF NOT EXISTS user_answer text;
ALTER TABLE question_reports ADD COLUMN IF NOT EXISTS status text DEFAULT 'open';
ALTER TABLE question_reports ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE question_reports ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users ON DELETE SET NULL;
ALTER TABLE question_reports ADD COLUMN IF NOT EXISTS resolution_note text;

-- 4) Traducir valores del vocabulario viejo
UPDATE question_reports SET reason = CASE reason
  WHEN 'respuesta_incorrecta' THEN 'clave_incorrecta'
  WHEN 'contenido_erroneo'    THEN 'otro'
  WHEN 'opciones_repetidas'   THEN 'opciones_incorrectas'
  ELSE reason
END;

UPDATE question_reports SET status = CASE status
  WHEN 'pendiente'  THEN 'open'
  WHEN 'revisado'   THEN 'reviewing'
  WHEN 'corregido'  THEN 'resolved'
  WHEN 'descartado' THEN 'rejected'
  ELSE status
END;

-- 5) Backfill defensivo y NOT NULL
UPDATE question_reports SET reason = 'otro' WHERE reason IS NULL;
UPDATE question_reports SET status = 'open' WHERE status IS NULL;
ALTER TABLE question_reports ALTER COLUMN reason SET NOT NULL;
ALTER TABLE question_reports ALTER COLUMN status SET NOT NULL;
ALTER TABLE question_reports ALTER COLUMN status SET DEFAULT 'open';

-- 6) Check constraints nuevos
ALTER TABLE question_reports ADD CONSTRAINT valid_reason CHECK (reason IN (
  'clave_incorrecta',
  'enunciado_confuso',
  'error_tipografico',
  'imagen_no_carga',
  'opciones_incorrectas',
  'otro'
));
ALTER TABLE question_reports ADD CONSTRAINT valid_status CHECK (status IN (
  'open', 'reviewing', 'resolved', 'rejected'
));

-- 7) RLS + policies
ALTER TABLE question_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own reports" ON question_reports;
DROP POLICY IF EXISTS "Users can view own reports"   ON question_reports;
DROP POLICY IF EXISTS "Service role full access"     ON question_reports;

CREATE POLICY "Users can insert own reports"
  ON question_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own reports"
  ON question_reports FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access"
  ON question_reports FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 8) Indexes
CREATE INDEX IF NOT EXISTS idx_question_reports_question_id ON question_reports(question_id);
CREATE INDEX IF NOT EXISTS idx_question_reports_status      ON question_reports(status);
CREATE INDEX IF NOT EXISTS idx_question_reports_created_at  ON question_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_question_reports_user_id     ON question_reports(user_id);

GRANT SELECT, INSERT ON question_reports TO authenticated;

-- 9) Vista admin
DROP VIEW IF EXISTS question_reports_admin;
CREATE VIEW question_reports_admin AS
SELECT
  r.id,
  r.created_at,
  r.status,
  r.reason,
  r.details,
  r.user_answer,
  q.id AS question_id,
  q.subject,
  q.area_tematica,
  q.tema,
  q.subtema,
  q.content,
  q.correct_answer,
  q.options,
  q.explanation,
  q.origen,
  u.email AS reporter_email,
  r.reviewed_at,
  r.resolution_note
FROM question_reports r
JOIN questions q ON q.id = r.question_id
LEFT JOIN auth.users u ON u.id = r.user_id
ORDER BY r.created_at DESC;

COMMENT ON TABLE question_reports       IS 'Reportes de usuarios sobre errores en preguntas';
COMMENT ON VIEW  question_reports_admin IS 'Vista admin con contexto completo para revisar reportes';
