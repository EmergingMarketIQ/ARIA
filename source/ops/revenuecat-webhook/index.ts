// revenuecat-webhook — sets EMIQ premium status server-side from RevenueCat events.
// NOT DEPLOYED YET. Deploy order (so paying users never lose access):
//   1) supabase secrets set REVENUECAT_WEBHOOK_AUTH=<long random string>
//   2) supabase functions deploy revenuecat-webhook --no-verify-jwt
//   3) RevenueCat → Project → Integrations → Webhooks: URL https://bznlmkaepbhrpflvdxix.supabase.co/functions/v1/revenuecat-webhook,
//      Authorization header = the same random string. Send a test event and confirm a 200.
//   4) Apply ops/lock_premium_columns.sql (stops clients writing subscription_tier/status).
// The app configures RevenueCat with appUserID = Supabase user id, so app_user_id maps to user_profiles.id.
import { createClient } from 'npm:@supabase/supabase-js@2';
const AUTH = Deno.env.get('REVENUECAT_WEBHOOK_AUTH') ?? '';
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const ACTIVE = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'PRODUCT_CHANGE', 'NON_RENEWING_PURCHASE', 'SUBSCRIPTION_EXTENDED', 'TEMPORARY_ENTITLEMENT_GRANT']);
const INACTIVE = new Set(['EXPIRATION']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });
  if (!AUTH || req.headers.get('authorization') !== AUTH) return new Response('unauthorized', { status: 401 });
  const body = await req.json().catch(() => null);
  const ev = body?.event;
  if (!ev?.type) return new Response('bad request', { status: 400 });
  const ids = [ev.app_user_id, ev.original_app_user_id, ...(ev.aliases ?? [])].filter((x: string) => UUID.test(String(x)));
  const entitled = (ev.entitlement_ids ?? []).includes('premium') || ev.entitlement_id === 'premium';
  let status: string | null = null;
  if (ACTIVE.has(ev.type) && entitled) status = 'active';
  if (INACTIVE.has(ev.type)) status = 'inactive';
  if (!status || !ids.length) return new Response(JSON.stringify({ ok: true, ignored: ev.type }), { status: 200 });
  const { error } = await db.from('user_profiles').update({ subscription_tier: status === 'active' ? 'premium' : 'free', subscription_status: status }).in('id', ids);
  if (error) { console.error(error); return new Response('db error', { status: 500 }); }
  return new Response(JSON.stringify({ ok: true, type: ev.type, status }), { status: 200, headers: { 'Content-Type': 'application/json' } });
});
