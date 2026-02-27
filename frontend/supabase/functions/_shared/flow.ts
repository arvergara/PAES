const FLOW_API_KEY = Deno.env.get('FLOW_API_KEY')!;
const FLOW_SECRET_KEY = Deno.env.get('FLOW_SECRET_KEY')!;
const FLOW_API_URL = Deno.env.get('FLOW_API_URL') || 'https://www.flow.cl/api';

async function signParams(params: Record<string, string>): Promise<string> {
  const keys = Object.keys(params).sort();
  const toSign = keys.map((key) => `${key}${params[key]}`).join('');
  const encoder = new TextEncoder();
  const keyData = encoder.encode(FLOW_SECRET_KEY);
  const msgData = encoder.encode(toSign);
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function flowPost(
  endpoint: string, params: Record<string, string | number>
): Promise<Record<string, unknown>> {
  const strParams: Record<string, string> = { apiKey: FLOW_API_KEY };
  for (const [key, value] of Object.entries(params)) {
    strParams[key] = String(value);
  }
  const signature = await signParams(strParams);
  strParams['s'] = signature;
  const body = new URLSearchParams(strParams);
  const response = await fetch(`${FLOW_API_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`Flow API error ${response.status}: ${JSON.stringify(data)}`);
  return data;
}

export async function flowGet(
  endpoint: string, params: Record<string, string | number> = {}
): Promise<Record<string, unknown>> {
  const strParams: Record<string, string> = { apiKey: FLOW_API_KEY };
  for (const [key, value] of Object.entries(params)) {
    strParams[key] = String(value);
  }
  const signature = await signParams(strParams);
  strParams['s'] = signature;
  const queryString = new URLSearchParams(strParams).toString();
  const response = await fetch(`${FLOW_API_URL}${endpoint}?${queryString}`, { method: 'GET' });
  const data = await response.json();
  if (!response.ok) throw new Error(`Flow API error ${response.status}: ${JSON.stringify(data)}`);
  return data;
}
