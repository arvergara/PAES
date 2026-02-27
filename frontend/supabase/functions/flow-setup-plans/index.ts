import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { flowPost } from '../_shared/flow.ts';
import { corsHeaders } from '../_shared/supabase-admin.ts';

const PLANS = [
  {
    planId: 'tutorpaes-mensual',
    name: 'TutorPAES Mensual',
    currency: 'CLP',
    amount: 24990,
    interval: 3,
    interval_count: 1,
    trial_period_days: 0,
    days_until_due: 3,
    charges_retries_number: 3,
  },
  {
    planId: 'tutorpaes-anual',
    name: 'TutorPAES Anual',
    currency: 'CLP',
    amount: 119000,
    interval: 4,
    interval_count: 1,
    trial_period_days: 0,
    days_until_due: 3,
    charges_retries_number: 3,
  },
];

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  try {
    const results = [];
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const webhookUrl = `${supabaseUrl}/functions/v1/flow-webhook`;

    for (const plan of PLANS) {
      try {
        const result = await flowPost('/plans/create', {
          ...plan,
          urlCallback: webhookUrl,
        });
        results.push({ planId: plan.planId, status: 'created', data: result });
      } catch (error) {
        results.push({ planId: plan.planId, status: 'error', error: error.message });
      }
    }
    return new Response(JSON.stringify({ success: true, plans: results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
