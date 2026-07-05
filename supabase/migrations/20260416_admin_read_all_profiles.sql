-- ============================================================================
-- Migración: admins pueden leer todos los profiles
-- Fecha: 2026-04-16
-- Necesario para que el panel de reportes muestre el email del reporter.
-- La policy base solo permite "read own profile". Idempotente.
-- ============================================================================

DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT TO authenticated
  USING (public.is_admin());
