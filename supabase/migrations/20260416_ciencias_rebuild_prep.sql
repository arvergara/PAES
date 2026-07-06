-- ============================================================================
-- Prep para recarga limpia de Ciencias (reprocesado desde PDF oficial DEMRE)
-- Fecha: 2026-04-16
-- Aplicada vía MCP; se versiona aquí para trazabilidad. Idempotente.
-- ============================================================================

-- Columna lote: identifica el batch reprocesado (permite rollback)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS lote text;

-- Índice único PARCIAL: idempotencia solo sobre el batch nuevo
-- (parcial para no chocar con los duplicados del banco viejo que quedan inactivos)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_questions_reprocesado
  ON questions (subject, md5(content))
  WHERE lote = 'ciencias_oficial_2026';

COMMENT ON COLUMN questions.lote IS 'Identificador de lote de carga; ciencias_oficial_2026 = reprocesado desde PDF oficial DEMRE';
