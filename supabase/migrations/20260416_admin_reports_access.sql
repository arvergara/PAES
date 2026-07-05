-- ============================================================================
-- Migración: admin role + acceso admin a question_reports
-- Fecha: 2026-04-16
-- Agrega flag is_admin a profiles, helper public.is_admin(), policies para
-- que admins vean/actualicen todos los reportes, y seed inicial de admins.
-- Idempotente.
-- ============================================================================

-- 1) Columna is_admin en profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;

-- 2) Helper: devuelve true si el usuario actual es admin.
-- SECURITY DEFINER para que pueda leer profiles sin depender de la RLS del caller.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT p.is_admin FROM profiles p WHERE p.id = auth.uid()),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 3) Seed de admins (por email — el profile puede o no existir aún).
-- Inserta profile si falta y marca is_admin=true. Si ya existe, solo flag-ea.
INSERT INTO profiles (id, email, is_admin)
SELECT u.id, u.email, true
FROM auth.users u
WHERE u.email IN ('andres.vergara@maindset.cl', 'tomas.vergara.ur@gmail.com')
ON CONFLICT (id) DO UPDATE SET is_admin = true;

-- 4) Policies admin sobre question_reports
-- SELECT: admin ve todos (además de la policy "Users can view own reports")
DROP POLICY IF EXISTS "Admins can view all reports" ON question_reports;
CREATE POLICY "Admins can view all reports"
  ON question_reports FOR SELECT TO authenticated
  USING (public.is_admin());

-- UPDATE: admin puede cambiar status, reviewed_at, reviewed_by, resolution_note
DROP POLICY IF EXISTS "Admins can update reports" ON question_reports;
CREATE POLICY "Admins can update reports"
  ON question_reports FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT UPDATE ON question_reports TO authenticated;

COMMENT ON FUNCTION public.is_admin() IS 'Devuelve true si el usuario autenticado tiene profiles.is_admin = true';
