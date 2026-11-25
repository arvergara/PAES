-- ============================================================================
-- Suscripciones y Pagos - Flow.cl Integration
-- ============================================================================

-- 1. Agregar campos de suscripción a profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free'
  CHECK (plan IN ('free', 'premium'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS flow_customer_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS flow_subscription_id text;

CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_plan_expires ON profiles(plan_expires_at);

-- 2. Tabla de pagos
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Flow data
  flow_order text,              -- Número de orden Flow
  flow_token text,              -- Token de la transacción
  flow_status integer,          -- 1=pendiente, 2=pagada, 3=rechazada, 4=anulada

  -- Payment info
  amount integer NOT NULL,      -- Monto en CLP
  currency text DEFAULT 'CLP',
  description text,
  payment_method text,          -- WebPay, Servipag, Multicaja, etc.

  -- Plan info
  plan text NOT NULL CHECK (plan IN ('premium')),
  period_start timestamptz,
  period_end timestamptz,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  paid_at timestamptz,

  -- Raw response from Flow
  flow_response jsonb
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_flow_order ON payments(flow_order);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(flow_status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- RLS for payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users can see their own payments
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Only service_role can insert/update (from Edge Functions)
CREATE POLICY "Service role full access on payments" ON payments
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 3. Allow service_role to update profiles (for webhook)
CREATE POLICY "Service role can update profiles" ON profiles
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 4. Function to check if user has active premium plan
CREATE OR REPLACE FUNCTION is_premium(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_uuid
    AND plan = 'premium'
    AND (plan_expires_at IS NULL OR plan_expires_at > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
