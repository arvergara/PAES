// Flow.cl API helper for Supabase Edge Functions
// Docs: https://developers.flow.cl/en/api

const FLOW_API_URL = Deno.env.get('FLOW_ENV') === 'sandbox'
  ? 'https://sandbox.flow.cl/api'
  : 'https://www.flow.cl/api';

const FLOW_API_KEY = Deno.env.get('FLOW_API_KEY')!;
const FLOW_SECRET_KEY = Deno.env.get('FLOW_SECRET_KEY')!;

/**
 * Sign Flow API parameters using HMAC-SHA256
 * 1. Sort params alphabetically by key
 * 2. Concatenate as keyvalue pairs
 * 3. HMAC-SHA256 with secret key
 */
async function signParams(params: Record<string, string>): Promise<string> {
  const sorted = Object.keys(params).sort();
  const toSign = sorted.map(k => `${k}${params[k]}`).join('');

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(FLOW_SECRET_KEY),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(toSign));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Create a payment order in Flow
 */
export async function createPaymentOrder(params: {
  commerceOrder: string;
  amount: number;
  email: string;
  subject: string;
  urlConfirmation: string;
  urlReturn: string;
  optional?: Record<string, string>;
}) {
  const body: Record<string, string> = {
    apiKey: FLOW_API_KEY,
    commerceOrder: params.commerceOrder,
    subject: params.subject,
    currency: 'CLP',
    amount: params.amount.toString(),
    email: params.email,
    urlConfirmation: params.urlConfirmation,
    urlReturn: params.urlReturn,
    ...params.optional,
  };

  body.s = await signParams(body);

  const formData = new URLSearchParams(body);
  const resp = await fetch(`${FLOW_API_URL}/payment/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString(),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Flow payment/create failed: ${resp.status} - ${err}`);
  }

  return await resp.json();
}

/**
 * Get payment status from Flow
 */
export async function getPaymentStatus(token: string) {
  const params: Record<string, string> = {
    apiKey: FLOW_API_KEY,
    token,
  };

  params.s = await signParams(params);

  const qs = new URLSearchParams(params).toString();
  const resp = await fetch(`${FLOW_API_URL}/payment/getStatus?${qs}`, {
    method: 'GET',
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Flow payment/getStatus failed: ${resp.status} - ${err}`);
  }

  return await resp.json();
}

export { FLOW_API_URL, FLOW_API_KEY };
