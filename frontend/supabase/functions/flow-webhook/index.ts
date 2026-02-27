import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { flowGet } from '../_shared/flow.ts';
import { supabaseAdmin } from '../_shared/supabase-admin.ts';

async function recordPayment(
  userId: string | null, subscriptionId: string | null,
  flowOrder: number, flowStatus: number, amount: number,
  fullPaymentData: Record<string, unknown>
) {
  const paymentData = fullPaymentData.paymentData as Record<string, unknown> | null;
  await supabaseAdmin.from('payment_history').insert({
    user_id: userId, subscription_id: subscriptionId,
    flow_order: String(flowOrder), flow_status: flowStatus,
    amount, currency: 'CLP',
    status: flowStatus === 1 ? 'completed' : flowStatus === 2 ? 'failed' : 'pending',
    payment_method: paymentData?.media || null,
    flow_data: fullPaymentData,
    paid_at: flowStatus === 1 ? new Date().toISOString() : null,
  });
}

serve(async (req: Request) => {
  try {
    let token: string | null = null;
    if (req.method === 'POST') {
      const body = await req.text();
      const params = new URLSearchParams(body);
      token = params.get('token');
    }
    if (!token) {
      console.error('Webhook: no token received');
      return new Response('No token', { status: 400 });
    }

    const payment = await flowGet('/payment/getStatus', { token });
    console.log('Webhook payment data:', JSON.stringify(payment));

    const flowOrder = payment.flowOrder as number;
    const status = payment.status as number;
    const amount = payment.amount as number;
    const payer = payment.payer as string;

    const { data: existingPayment } = await supabaseAdmin
      .from('payment_history').select('id').eq('flow_order', String(flowOrder)).single();

    if (existingPayment) {
      console.log(`Payment ${flowOrder} already processed, skipping.`);
      return new Response('OK', { status: 200 });
    }

    const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
    const matchedUser = userData?.users?.find(
      (u) => u.email?.toLowerCase() === payer?.toLowerCase()
    );

    if (!matchedUser) {
      console.error(`No user found for payer: ${payer}`);
      await recordPayment(null, null, flowOrder, status, amount, payment);
      return new Response('OK', { status: 200 });
    }

    const { data: subscription } = await supabaseAdmin
      .from('subscriptions').select('*').eq('user_id', matchedUser.id).single();

    if (!subscription) {
      console.error(`No subscription found for user: ${matchedUser.id}`);
      await recordPayment(matchedUser.id, null, flowOrder, status, amount, payment);
      return new Response('OK', { status: 200 });
    }

    await recordPayment(matchedUser.id, subscription.id, flowOrder, status, amount, payment);

    if (status === 1) {
      const now = new Date();
      const periodEnd = subscription.plan === 'monthly'
        ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      await supabaseAdmin.from('subscriptions').update({
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: now.toISOString(),
      }).eq('id', subscription.id);
      console.log(`Subscription ${subscription.id} renewed until ${periodEnd.toISOString()}`);
    } else if (status === 2) {
      await supabaseAdmin.from('subscriptions').update({
        status: 'past_due', updated_at: new Date().toISOString(),
      }).eq('id', subscription.id);
      console.log(`Subscription ${subscription.id} marked as past_due`);
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('flow-webhook error:', error);
    return new Response('OK', { status: 200 });
  }
});
