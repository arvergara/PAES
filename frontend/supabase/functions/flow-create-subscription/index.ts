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

    const { plan } = await req.json();
    if (!plan || !['monthly', 'annual'].includes(plan)) {
      return new Response(JSON.stringify({ error: 'Plan inválido. Use "monthly" o "annual".' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const amount = plan === 'monthly' ? 24990 : 119000;

    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions').select('*').eq('user_id', user.id).single();

    if (subError && subError.code !== 'PGRST116') {
      throw new Error(`Error fetching subscription: ${subError.message}`);
    }

    let flowCustomerId = subscription?.flow_customer_id;

    if (!flowCustomerId) {
      const customerResult = await flowPost('/customer/create', {
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
        email: user.email!,
        externalId: user.id,
      });
      flowCustomerId = customerResult.customerId as string;

      await supabaseAdmin.from('subscriptions').update({
        flow_customer_id: flowCustomerId, plan, amount,
        updated_at: new Date().toISOString(),
      }).eq('user_id', user.id);
    } else {
      await supabaseAdmin.from('subscriptions').update({
        plan, amount, updated_at: new Date().toISOString(),
      }).eq('user_id', user.id);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const cardCallbackUrl = `${supabaseUrl}/functions/v1/flow-card-callback`;

    const registerResult = await flowPost('/customer/register', {
      customerId: flowCustomerId,
      url_return: cardCallbackUrl,
    });

    const redirectUrl = `${registerResult.url}?token=${registerResult.token}`;

    return new Response(JSON.stringify({
      success: true, redirectUrl, url: registerResult.url, token: registerResult.token,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('flow-create-subscription error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
    });
  }
});
