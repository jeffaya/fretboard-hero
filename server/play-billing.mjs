// Purchase tokens are bearer credentials: never log them or return Google errors.
export const PACKAGES = new Set(['com.guitar.fretboardhero', 'com.bass.fretboardhero', 'com.ukulele.fretboardhero']);
export const PRODUCT = 'full_access';
const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const encode = value => btoa(String.fromCharCode(...new Uint8Array(value))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const text64 = value => encode(new TextEncoder().encode(JSON.stringify(value)));
let oauthCache;
let oauthPending;

async function accessToken(env, fetcher) {
  const now = Math.floor(Date.now() / 1000);
  if (oauthCache?.email === env.PLAY_SERVICE_ACCOUNT_EMAIL && oauthCache.expires > now + 60) return oauthCache.token;
  if (oauthPending) return oauthPending;
  oauthPending = (async () => {
    const pem = env.PLAY_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
    const key = await crypto.subtle.importKey('pkcs8', Uint8Array.from(atob(pem), c => c.charCodeAt(0)), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
    const unsigned = `${text64({ alg: 'RS256', typ: 'JWT' })}.${text64({ iss: env.PLAY_SERVICE_ACCOUNT_EMAIL, scope: 'https://www.googleapis.com/auth/androidpublisher', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })}`;
    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
    const response = await fetcher('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${encode(signature)}` }), signal: AbortSignal.timeout(6000) });
    if (!response.ok) throw new Error('OAuth unavailable');
    const result = await response.json();
    if (typeof result.access_token !== 'string') throw new Error('OAuth unavailable');
    oauthCache = { email: env.PLAY_SERVICE_ACCOUNT_EMAIL, token: result.access_token, expires: now + Math.min(Number(result.expires_in) || 300, 3600) };
    return oauthCache.token;
  })();
  try { return await oauthPending; } finally { oauthPending = null; }
}

// Dependencies are injectable to test Google's responses without real purchases.
export async function verifyPurchase(input, { fetcher = fetch, getAccessToken, env }) {
  const bearer = await getAccessToken(env, fetcher);
  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(input.packageName)}/purchases/products/${PRODUCT}/tokens/${encodeURIComponent(input.purchaseToken)}`;
  const headers = { Authorization: `Bearer ${bearer}` };
  const response = await fetcher(url, { headers, signal: AbortSignal.timeout(6000) });
  if (response.status === 401) oauthCache = null;
  if ([400, 404, 410].includes(response.status)) return { unlocked: false, status: 'not_owned' };
  if (!response.ok) throw new Error('Verification unavailable');
  const purchase = await response.json();
  if (purchase.purchaseState === 2) return { unlocked: false, status: 'pending' };
  if (purchase.purchaseState !== 0 || purchase.consumptionState !== 0 || (purchase.productId && purchase.productId !== PRODUCT)) return { unlocked: false, status: 'not_owned' };
  // Non-consumable: acknowledge once, never consume. Retry safely after outages.
  if (purchase.acknowledgementState === 0) {
    const acknowledged = await fetcher(`${url}:acknowledge`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(6000) });
    if (!acknowledged.ok) {
      // Another request may already have acknowledged the same purchase.
      const recheck = await fetcher(url, { headers, signal: AbortSignal.timeout(6000) });
      if (!recheck.ok) throw new Error('Acknowledgement unavailable');
      const latest = await recheck.json();
      if (latest.purchaseState !== 0 || latest.consumptionState !== 0) return { unlocked: false, status: 'not_owned' };
      if (latest.acknowledgementState !== 1) throw new Error('Acknowledgement unavailable');
    }
  } else if (purchase.acknowledgementState !== 1) throw new Error('Invalid acknowledgement state');
  return { unlocked: true, status: 'purchased' };
}

export async function handlePlayBilling(request, env, dependencies = {}) {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return json({ error: 'invalid_request' }, 415);
  // Native HTTPS requests only; no browser CORS access is needed.
  if (request.headers.has('origin')) return json({ error: 'invalid_request' }, 403);
  if (env.PLAY_BILLING_LIMITER) {
    const limited = await env.PLAY_BILLING_LIMITER.limit({ key: request.headers.get('CF-Connecting-IP') || 'unknown' });
    if (!limited.success) return json({ error: 'try_later' }, 429);
  }
  let input;
  try {
    const reader = request.body?.getReader();
    if (!reader) return json({ error: 'invalid_request' }, 400);
    let text = '', size = 0; const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 4096) { await reader.cancel(); return json({ error: 'invalid_request' }, 413); }
      text += decoder.decode(value, { stream: true });
    }
    input = JSON.parse(text + decoder.decode());
  } catch { return json({ error: 'invalid_request' }, 400); }
  if (!input || !PACKAGES.has(input.packageName) || input.productId !== PRODUCT || typeof input.purchaseToken !== 'string' || !/^[A-Za-z0-9._~-]{10,2048}$/.test(input.purchaseToken)) return json({ error: 'invalid_request' }, 400);
  if (!env.PLAY_SERVICE_ACCOUNT_EMAIL || !env.PLAY_SERVICE_ACCOUNT_PRIVATE_KEY) return json({ error: 'billing_not_configured' }, 503);
  try {
    return json(await verifyPurchase(input, { env, fetcher: dependencies.fetcher || fetch, getAccessToken: dependencies.getAccessToken || accessToken }));
  } catch { return json({ error: 'verification_unavailable' }, 503); }
}
