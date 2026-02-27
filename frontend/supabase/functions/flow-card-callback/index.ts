import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { flowGet, flowPost } from '../_shared/flow.ts';
import { supabaseAdmin } from '../_shared/supabase-admin.ts';

const SITE_URL = Deno.env.get('SITE_URL') || 'https://tutorpaes.cl';

serve(async (req: Request) => {
  try {
    let token: string | null = null;

    if (req.method === 'POST') {
      const body = await req.text();
      const params = new URLSearchParams(body);
      token = params.get('token');
    } else if (req.method === 'GET') {
      const url = new URL(req.url);
      token = url.searchParams.get('token');
    }

    if (!token) {
      return Response.redirect(`${SITE_URL}/payment/error?reason=no_token`, 302);
    }

    const registerStatus = await flowGet('/customer/getRegisterStatus', { token });

    if (registerStatus.status !== '1' && registerStatus.status !== 1) {
      console.error('Card registration failed:', registerStatus);
      return Response.redirect(`${SITE_URL}/payment/error?reason=card_failed`, 302);
    }

    const flowCustomerId = registerStatus.customerId as string;

    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions').select('*').eq('flow_customer_id', flowCustomerId).single();

    if (subError || !subscription) {
      console.error('Subscription not found for customer:', flowCustomerId);
      return Response.redirect(`${SITE_URL}/payment/error?reason=no_subscription`, 302);
    }

    const flowPlanId = subscription.plan === 'monthly' ? 'tutorpaes-mensual' : 'tutorpaes-anual';

    const subscriptionResult = await flowPost('/subscription/create', {
      planId: flowPlanId,
      customerId: flowCustomerId,
    });

    const flowSubscriptionId = subscriptionResult.subscriptionId as string;

    const now = new Date();
    const periodEnd = subscription.plan === 'monthly'
      ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    await supabaseAdmin.from('subscriptions').update({
      status: 'active',
      flow_subscription_id: flowSubscriptionId,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      updated_at: now.toISOString(),
    }).eq('id', subscription.id);

    return Response.redirect(`${SITE_URL}/payment/success?plan=${subscription.plan}`, 302);
  } catch (error) {
    console.error('flow-card-callback error:', error);
    return Response.redirect(`${SITE_URL}/payment/error?reason=server_error`, 302);
  }
});
