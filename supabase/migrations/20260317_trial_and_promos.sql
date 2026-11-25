-- ===========================================
-- 1. Auto-trial: 14 días gratis al registrarse
-- ===========================================

-- Función que crea suscripción trial al registrarse un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user_trial()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, status, plan, trial_start, trial_end)
  VALUES (
    NEW.id,
    'trialing',
    'premium',
    NOW(),
    NOW() + INTERVAL '14 days'
  )
  ON CONFLICT (user_id) DO NOTHING; -- no sobreescribir si ya existe
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_trial ON auth.users;
CREATE TRIGGER on_auth_user_created_trial
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_trial();

-- ===========================================
-- 2. Tabla de códigos promocionales
-- ===========================================

CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_percent INTEGER NOT NULL DEFAULT 50, -- porcentaje de descuento
  max_uses INTEGER DEFAULT NULL, -- NULL = ilimitado
  current_uses INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ DEFAULT NULL, -- NULL = no expira
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla para rastrear qué usuario usó qué código
CREATE TABLE IF NOT EXISTS public.promo_code_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(promo_code_id, user_id) -- cada usuario puede usar un código solo una vez
);

-- RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_uses ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden leer códigos activos (para validar)
CREATE POLICY "Anyone can read active promo codes" ON public.promo_codes
  FOR SELECT USING (active = true);

-- Solo service_role puede modificar
CREATE POLICY "Service role manages promo codes" ON public.promo_codes
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can see own promo uses" ON public.promo_code_uses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role manages promo uses" ON public.promo_code_uses
  FOR ALL USING (auth.role() = 'service_role');

-- ===========================================
-- 3. Función para incrementar usos de código
-- ===========================================
CREATE OR REPLACE FUNCTION public.increment_promo_uses(promo_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.promo_codes
  SET current_uses = current_uses + 1
  WHERE id = promo_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- 4. Insertar algunos códigos de ejemplo
-- ===========================================
INSERT INTO public.promo_codes (code, discount_percent, max_uses, expires_at) VALUES
  ('PAES50', 50, NULL, '2026-06-17'::timestamptz),
  ('AMIGOS50', 50, 20, '2026-04-17'::timestamptz)
ON CONFLICT (code) DO NOTHING;
