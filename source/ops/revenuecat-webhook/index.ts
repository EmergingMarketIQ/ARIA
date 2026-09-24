// revenuecat-webhook — sets EMIQ premium status server-side from RevenueCat events.
// Auth: RevenueCat sends the Authorization header configured in its dashboard; we compare it with
// web_private_config.revenuecat_webhook_auth (service-role only). Deployed with verify_jwt = false.
// The app configures RevenueCat with appUserID = Supabase user id, so app_user_id maps to user_profiles.id.
import { createClient } from 'npm:@supabase/supabase-js@2';
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const ACTIVE = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'PRODUCT_CHANGE', 'NON_RENEWING_PURCHASE', 'SUBSCRIPTION_EXTENDED', 'TEMPORARY_ENTITLEMENT_GRANT']);
const INACTIVE = new Set(['EXPIRATION']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ok = (b: unknown) => new Response(JSON.stringify(b), { status: 200, headers: { 'Content-Type': 'application/json' } });
Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });
  const { data: cfg } = await db.from('web_private_config').select('value').eq('key', 'revenuecat_webhook_auth').maybeSingle();
  if (!cfg?.value || req.headers.get('authorization') !== cfg.value) return new Response('unauthorized', { status: 401 });
  const body = await req.json().catch(() => null);
  const ev = body?.event;
  if (!ev?.type) return new Response('bad request', { status: 400 });
  const ids = [ev.app_user_id, ev.original_app_user_id, ...(ev.aliases ?? [])].filter((x: string) => UUID.test(String(x)));
  const entitled = (ev.entitlement_ids ?? []).includes('premium') || ev.entitlement_id === 'premium';
  let status: string | null = null;
  if (ACTIVE.has(ev.type) && entitled) status = 'active';
  if (INACTIVE.has(ev.type)) status = 'inactive';
  if (!status || !ids.length) return ok({ ok: true, ignored: ev.type });
  const { error } = await db.from('user_profiles').update({ subscription_tier: status === 'active' ? 'premium' : 'free', subscription_status: status }).in('id', ids);
  if (error) { console.error(error); return new Response('db error', { status: 500 }); }
  return ok({ ok: true, type: ev.type, status });
});
