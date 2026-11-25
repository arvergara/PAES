// Edge Function: Create a Flow.cl payment order
// Called from frontend when user clicks "Suscribirse"

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createPaymentOrder } from '../_shared/flow.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SITE_URL = Deno.env.get('SITE_URL') || 'https://tutorpaes.cl';

const PLAN_PRICE = 25000; // CLP mensual

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Verify user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check for promo code
    const body = await req.json().catch(() => ({}));
    const promoCode = body.promoCode?.trim()?.toUpperCase();
    let finalAmount = PLAN_PRICE;
    let promoCodeId: string | null = null;

    if (promoCode) {
      // Validate promo code
      const { data: promo, error: promoError } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode)
        .eq('active', true)
        .maybeSingle();

      if (promoError || !promo) {
        return new Response(JSON.stringify({ error: 'Código promocional inválido' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check expiration
      if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: 'Código promocional expirado' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check max uses
      if (promo.max_uses !== null && promo.current_uses >= promo.max_uses) {
        return new Response(JSON.stringify({ error: 'Código promocional agotado' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if user already used this code
      const { data: existingUse } = await supabase
        .from('promo_code_uses')
        .select('id')
        .eq('promo_code_id', promo.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingUse) {
        return new Response(JSON.stringify({ error: 'Ya usaste este código promocional' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Apply discount
      finalAmount = Math.round(PLAN_PRICE * (1 - promo.discount_percent / 100));
      promoCodeId = promo.id;
    }

    // Generate unique order ID
    const commerceOrder = `PAES-${user.id.slice(0, 8)}-${Date.now()}`;

    // Create payment record in DB (pending)
    const { error: insertError } = await supabase.from('payment_history').insert({
      user_id: user.id,
      flow_order: commerceOrder,
      amount: finalAmount,
      status: 'pending',
      flow_status: 1,
    });

    if (insertError) {
      console.error('DB insert error:', insertError);
      return new Response(JSON.stringify({ error: 'Error al crear orden' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Flow payment order
    const flowResponse = await createPaymentOrder({
      commerceOrder,
      amount: finalAmount,
      email: user.email || '',
      subject: promoCode
        ? `TutorPAES Premium - Mensual (${promoCode})`
        : 'TutorPAES Premium - Suscripción Mensual',
      urlConfirmation: `${SUPABASE_URL}/functions/v1/flow-webhook`,
      urlReturn: `${SITE_URL}/payment/result`,
    });

    // Register promo code use and increment counter
    if (promoCodeId) {
      await supabase.from('promo_code_uses').insert({
        promo_code_id: promoCodeId,
        user_id: user.id,
      });
      await supabase.rpc('increment_promo_uses', { promo_id: promoCodeId });
    }

    const paymentUrl = `${flowResponse.url}?token=${flowResponse.token}`;

    return new Response(JSON.stringify({
      paymentUrl,
      commerceOrder,
      token: flowResponse.token,
      amount: finalAmount,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
