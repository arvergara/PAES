// Edge Function: Flow.cl webhook handler
// Flow sends a POST to this URL when payment status changes
// Flow sends: token=xxx (form-urlencoded)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getPaymentStatus } from '../_shared/flow.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  try {
    // Flow sends POST with form-urlencoded body containing "token"
    const formData = await req.formData();
    const token = formData.get('token') as string;

    if (!token) {
      console.error('Webhook: no token received');
      return new Response('No token', { status: 400 });
    }

    console.log('Webhook received, token:', token);

    // Get payment status from Flow API
    const flowData = await getPaymentStatus(token);
    console.log('Flow payment status:', JSON.stringify(flowData));

    /*
      flowData example:
      {
        flowOrder: 12345,
        commerceOrder: "PAES-abc12345-1710...",
        requestDate: "2026-03-17 10:00:00",
        status: 2,           // 1=pending, 2=paid, 3=rejected, 4=canceled
        subject: "TutorPAES Premium",
        currency: "CLP",
        amount: 9990,
        payer: "user@email.com",
        paymentData: {
          date: "2026-03-17 10:05:00",
          media: "WebPay",
          ...
        }
      }
    */

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const commerceOrder = flowData.commerceOrder;
    const flowStatus = flowData.status;
    const isPaid = flowStatus === 2;

    // Update payment_history record
    const { data: payment, error: updateError } = await supabase
      .from('payment_history')
      .update({
        flow_status: flowStatus,
        status: isPaid ? 'paid' : flowStatus === 3 ? 'rejected' : flowStatus === 4 ? 'canceled' : 'pending',
        payment_method: flowData.paymentData?.media || null,
        paid_at: isPaid ? new Date().toISOString() : null,
        flow_data: flowData,
      })
      .eq('flow_order', commerceOrder)
      .select('user_id')
      .single();

    if (updateError) {
      console.error('Error updating payment:', updateError);
      return new Response('DB error', { status: 500 });
    }

    // If payment is successful, activate premium subscription
    if (isPaid && payment?.user_id) {
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1); // 1 month subscription

      // Upsert subscription
      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: payment.user_id,
          status: 'active',
          plan: 'premium',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          amount: flowData.amount,
          updated_at: now.toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (subError) {
        console.error('Error upserting subscription:', subError);
      } else {
        console.log(`Premium activated for user ${payment.user_id} until ${periodEnd.toISOString()}`);
      }
    }

    // Flow expects a 200 response
    return new Response('OK', { status: 200 });

  } catch (err) {
    console.error('Webhook error:', err);
    return new Response('Server error', { status: 500 });
  }
});
