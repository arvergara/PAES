-- ============================================================================
-- Tracking de "errores tontos": tipo de error auto-reportado por el alumno
-- Fecha: 2026-04-16 (aplicada vía MCP; se versiona para trazabilidad)
-- ============================================================================
ALTER TABLE question_attempts ADD COLUMN IF NOT EXISTS error_tag text;

ALTER TABLE question_attempts DROP CONSTRAINT IF EXISTS valid_error_tag;
ALTER TABLE question_attempts ADD CONSTRAINT valid_error_tag CHECK (
  error_tag IS NULL OR error_tag IN ('no_sabia','calculo','lectura','marcado','apuro')
);

CREATE INDEX IF NOT EXISTS idx_attempts_error_tag
  ON question_attempts(user_id, error_tag) WHERE error_tag IS NOT NULL;

COMMENT ON COLUMN question_attempts.error_tag IS 'Tipo de error auto-reportado: no_sabia=brecha real; calculo/lectura/marcado/apuro=error evitable';
