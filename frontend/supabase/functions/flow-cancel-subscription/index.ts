import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { flowPost } from '../_shared/flow.ts';
import { supabaseAdmin, corsHeaders, getUser } from '../_shared/supabase-admin.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  try {
    const user = await getUser(req);
    if (!user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions').select('*').eq('user_id', user.id).single();

    if (subError || !subscription) {
      return new Response(JSON.stringify({ error: 'No se encontró suscripción activa.' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (subscription.flow_subscription_id) {
      try {
        await flowPost('/subscription/cancel', {
          subscriptionId: subscription.flow_subscription_id,
          at_period_end: 1,
        });
      } catch (flowError) {
        console.error('Flow cancel error:', flowError);
      }
    }

    await supabaseAdmin.from('subscriptions').update({
      cancel_at_period_end: true,
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', subscription.id);

    return new Response(JSON.stringify({
      success: true,
      message: 'Tu suscripción se cancelará al final del período actual.',
      current_period_end: subscription.current_period_end,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('flow-cancel-subscription error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
    });
  }
});
