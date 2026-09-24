// web-leads — lead capture + unsubscribe for the web engines. Emails are sent by web-mailer.
import { createClient } from 'npm:@supabase/supabase-js@2';
const URL_ = Deno.env.get('SUPABASE_URL')!;
const db = createClient(URL_, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const PRODUCT = URL_.includes('ynfgpcaakydhtrhmqcur') ? 'unipath' : 'emiq';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
const clean = (s: unknown, n = 140) => String(s ?? '').replace(/[^\p{L}\p{N} .,&()'’\-\/+:@]/gu, '').slice(0, n).trim();
const INTENTS = ['full_report', 'reminders', 'premium_interest', 'advisor_call', 'newsletter'];
async function sha(s: string) { const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join(''); }
async function allow(key: string, limit: number) { const { data, error } = await db.rpc('web_hit', { p_key: key, p_limit: limit }); return error ? true : data === true; }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const body = await req.json().catch(() => ({}));
    if (body.action === 'unsub') {
      const token = String(body.token ?? '');
      if (!/^[0-9a-f]{32}$/.test(token)) return json({ error: 'invalid' }, 400);
      const { data: l } = await db.from('web_leads').select('email,product').eq('unsub_token', token).maybeSingle();
      if (l) await db.from('web_leads').update({ unsubscribed_at: new Date().toISOString(), status: 'unsubscribed' }).eq('product', l.product).eq('email', l.email).is('unsubscribed_at', null);
      return json({ ok: true });
    }
    const email = String(body.email ?? '').trim().toLowerCase();
    const intent = INTENTS.includes(body.intent) ? body.intent : null;
    if (!intent || !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email) || email.length > 254) return json({ error: 'invalid' }, 400);
    const ip = await sha('ip:' + ((req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown'));
    if (!(await allow(`lead:${ip}`, 20))) return json({ error: 'daily_limit' }, 429);
    const report_id = /^[A-Za-z0-9]{8}$/.test(String(body.report_id ?? '')) ? body.report_id : null;
    let intake: string | null = null;
    if (report_id) { const { data: rep } = await db.from('web_reports').select('inputs').eq('id', report_id).maybeSingle(); intake = rep?.inputs?.intake ?? null; }
    const row = {
      product: PRODUCT, email, intent, report_id, anon_id: clean(body.anon_id, 64) || null, consent_marketing: !!body.consent,
      context: { utm: body.utm ?? null, note: clean(body.note, 200) || null, price: clean(body.price, 20) || null },
      name: clean(body.name, 120) || null, company: clean(body.company, 160) || null,
      message: String(body.message ?? '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 1000) || null,
      preferred_times: clean(body.preferred_times, 120) || null, tz: clean(body.tz, 64) || null, intake,
    };
    const { error } = await db.from('web_leads').upsert(row, { onConflict: 'product,email,intent', ignoreDuplicates: true });
    if (error) { console.error(error); return json({ error: 'store_failed' }, 500); }
    return json({ ok: true });
  } catch (e) { console.error(e); return json({ error: 'server_error' }, 500); }
});
