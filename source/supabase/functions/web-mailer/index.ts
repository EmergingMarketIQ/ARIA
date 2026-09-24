// web-mailer — automatic lead emails for the web engines (runs every 10 min via pg_cron).
// UniPath: shortlist email + intake-timed reminders. EMIQ: call-request acknowledgement, pre-order acknowledgement.
// Config lives in public.web_private_config (service-role only): resend_api_key, from_email, reply_to, site_url, cron_secret.
// With no resend_api_key the function is a safe no-op: leads stay queued and are emailed once the key is added.
import { createClient } from 'npm:@supabase/supabase-js@2';
const URL_ = Deno.env.get('SUPABASE_URL')!;
const db = createClient(URL_, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const PRODUCT = URL_.includes('ynfgpcaakydhtrhmqcur') ? 'unipath' : 'emiq';
const BRAND = PRODUCT === 'unipath' ? { name: 'UniPath Australia', color: '#0A2540', accent: '#E5A442' } : { name: 'EmergingMarketIQ', color: '#0A1F44', accent: '#5B8DEF' };
const MAX_PER_RUN = 60;
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const aud = (n: number) => 'A$' + Math.round(n).toLocaleString('en-AU');

// ---- UniPath reminder plan (general guidance only; exact dates are set per course) ----
const PLAN: Record<string, [string, string | number][]> = {
  'feb-2027': [['apply', '2026-10-12'], ['offer', '2026-11-23'], ['depart', '2027-01-11']],
  'jul-2027': [['apply', '2027-03-01'], ['offer', '2027-04-26'], ['depart', '2027-06-07']],
  '2028': [['prepare', '2027-06-01'], ['apply', '2027-09-06'], ['offer', '2027-11-15']],
  'unsure': [['prepare', 14], ['apply', 45], ['offer', 90]],
};
const INTAKE_LABEL: Record<string, string> = { 'feb-2027': 'February 2027', 'jul-2027': 'July 2027', '2028': '2028', 'unsure': 'your' };
const WINDOW: Record<string, string> = { 'feb-2027': 'October–November 2026', 'jul-2027': 'April–May 2027', '2028': 'about three to four months before your chosen intake', 'unsure': 'about three to four months before the intake you choose' };

function layout(title: string, bodyHtml: string, unsubUrl: string | null) {
  return `<!doctype html><html><body style="margin:0;background:#F4F6FA;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1A2332">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:14px;overflow:hidden">
<tr><td style="background:${BRAND.color};padding:18px 24px;color:#fff;font-weight:700;font-size:17px">${BRAND.name}</td></tr>
<tr><td style="padding:24px;font-size:15px;line-height:1.55"><h1 style="font-size:21px;margin:0 0 12px;color:${BRAND.color}">${esc(title)}</h1>${bodyHtml}</td></tr>
<tr><td style="padding:16px 24px;background:#F8F9FB;font-size:12px;color:#5C6B80">General information only${PRODUCT === 'unipath' ? ' — not migration or financial advice. For personal visa advice, speak to a registered migration agent (MARA).' : ' — not legal, tax or investment advice.'}<br>${BRAND.name} · Melbourne, Australia · reply to this email to reach us.${unsubUrl ? `<br><a href="${unsubUrl}" style="color:#5C6B80">Unsubscribe</a>` : ''}</td></tr>
</table></td></tr></table></body></html>`;
}
const btn = (href: string, label: string) => `<p style="margin:20px 0"><a href="${href}" style="background:${BRAND.accent};color:${PRODUCT === 'unipath' ? '#1A1405' : '#fff'};padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600;display:inline-block">${esc(label)}</a></p>`;
const li = (items: string[]) => `<ul style="padding-left:18px;margin:8px 0">${items.map((x) => `<li style="margin:6px 0">${x}</li>`).join('')}</ul>`;

function upWelcome(lead: any, report: any, site: string) {
  const picks = (report?.picks ?? []).slice(0, 5);
  const link = report ? `${site}/report.html?id=${report.id}&utm_source=email&utm_medium=welcome` : `${site}/?utm_source=email`;
  const rows = picks.map((p: any) => `<b>${esc(p.name)}</b><br><span style="color:#5C6B80">${esc(p.uni)} · ${esc((p.cities || []).join(', '))} · ~${aud(p.annual)}/yr tuition · total incl. living ≈ ${aud(p.fee + 29710 * Math.max(p.weeks / 52, 0.5))}</span>`);
  const intake = INTAKE_LABEL[lead.intake] ?? 'your';
  return { subject: 'Your Australian university shortlist', html: layout('Your shortlist is saved',
    `<p>Here’s the shortlist you built on UniPath. Fees are CRICOS-register estimates — confirm each one on the university’s course page.</p>${rows.length ? li(rows) : ''}${btn(link, 'Open my full shortlist')}
<p><b>What happens next:</b> we’ll send you a few short reminders timed to ${intake === 'your' ? 'your' : 'the ' + intake} intake: when applications usually close, what to do after an offer, and a pre-departure checklist.</p>
<p>Want to compare more options? <a href="${site}/universities/index.html?utm_source=email">See fees for all 39 universities</a>.</p>`, null) };
}
function upReminder(kind: string, lead: any, report: any, site: string) {
  const link = report ? `${site}/report.html?id=${report.id}&utm_source=email&utm_medium=${kind}` : `${site}/?utm_source=email&utm_medium=${kind}`;
  const intake = INTAKE_LABEL[lead.intake] ?? 'your';
  const t: Record<string, [string, string, string]> = {
    prepare: ['Getting ready to apply', 'Start preparing', li(['Book your English test early (IELTS, PTE or TOEFL). Many coursework programs ask for IELTS 6.0–6.5 overall; nursing, teaching and many health courses often ask for 7.0 or more.', 'Collect documents: passport, academic transcripts and certificates, CV, and a short statement of purpose.', 'Plan your budget. For the student visa, Home Affairs uses A$29,710 a year for living costs (check the current figure on immi.homeaffairs.gov.au).'])],
    apply: [`Application season for ${intake === 'your' ? 'your' : intake} intake`, 'Time to apply', `<p>For ${intake === 'your' ? 'your' : 'the ' + intake} intake, many universities close applications around <b>${WINDOW[lead.intake] ?? 'three to four months before the intake'}</b>. Exact dates differ by course.</p>` + li(['Open each course on your shortlist and note its closing date and entry requirements.', 'Apply to two or three courses so you have options.', 'Ask each university about scholarships for international students — many are applied for with your admission.'])],
    offer: ['After you receive an offer', 'Offer, CoE and visa', li(['Accept your offer and pay the deposit to receive your Confirmation of Enrolment (CoE).', 'Arrange Overseas Student Health Cover (OSHC).', 'Apply for your Student visa (subclass 500) — check current processing times on the Home Affairs website and apply early.'])],
    depart: ['Pre-departure checklist', 'Getting ready to arrive', li(['Book accommodation for your first weeks.', 'Plan your arrival before orientation week.', 'Know the work rules: generally up to 48 hours per fortnight during study periods (check current conditions).'])],
  };
  const [subject, title, body] = t[kind];
  return { subject, html: layout(title, body + btn(link, 'Open my shortlist'), null) };
}
function emCallAck(lead: any, report: any, site: string) {
  const link = report ? `${site}/report.html?id=${report.id}&utm_source=email&utm_medium=call_ack` : site;
  const mk = (report?.picks ?? []).map((p: any) => p.country).join(', ');
  return { subject: 'Your EmergingMarketIQ call request', html: layout(`Thanks${lead.name ? ', ' + lead.name.split(' ')[0] : ''} — request received`,
    `<p>We’ve received your request for a free 20-minute market-entry call${lead.company ? ` for <b>${esc(lead.company)}</b>` : ''}.</p>
${lead.message ? `<p style="background:#F4F7FC;border-radius:10px;padding:12px">“${esc(lead.message)}”</p>` : ''}
<p>You’ll receive a calendar invitation with a Google Meet link, usually within one business day${lead.preferred_times ? ` (we’ll aim for your preferred time: ${esc(lead.preferred_times)})` : ''}.</p>
${mk ? `<p>We’ll use your analysis (${esc(mk)}) as the starting point.</p>${btn(link, 'Open my analysis')}` : ''}`, null) };
}
function preorderAck(lead: any, site: string, unsub: string) {
  const up = PRODUCT === 'unipath';
  return { subject: up ? 'You’re on the UniPath Premium early-access list' : 'Your deep-dive report pre-order interest',
    html: layout(up ? 'You’re on the early-access list' : 'Pre-order interest noted',
      up ? `<p>Thanks for your interest in UniPath Premium (unlimited ARIA chat, course comparison and an application tracker). We’ll email you when it opens. Nothing has been charged.</p>${btn(site + '/?utm_source=email&utm_medium=premium_ack', 'Back to UniPath')}`
         : `<p>Thanks for registering interest in the EmergingMarketIQ deep-dive report (tax, legal, compliance, cost model and 90-day entry plan, US$149). We’ll email you before anything is charged. Nothing has been charged.</p>${btn(site + '/?utm_source=email&utm_medium=preorder_ack', 'Back to EmergingMarketIQ')}`, unsub) };
}

async function send(cfg: Record<string, string>, lead: any, kind: string, mail: { subject: string; html: string }, unsubUrl: string | null) {
  const headers: Record<string, string> = {};
  if (unsubUrl) { headers['List-Unsubscribe'] = `<${unsubUrl}>`; headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click'; }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${cfg.resend_api_key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: cfg.from_email, to: [lead.email], reply_to: cfg.reply_to || 'supportmarketiq@gmail.com', subject: mail.subject, html: mail.html, headers }),
  });
  const d = await r.json().catch(() => ({}));
  await db.from('web_email_log').insert({ lead_id: lead.id, kind, to_email: lead.email, provider_id: d?.id ?? null, error: r.ok ? null : JSON.stringify(d).slice(0, 500) });
  return r.ok;
}
function withUnsub(html: string, url: string) { return html.replace('reply to this email to reach us.', `reply to this email to reach us.<br><a href="${url}" style="color:#5C6B80">Unsubscribe</a>`); }

Deno.serve(async (req) => {
  const { data: rows } = await db.from('web_private_config').select('key,value');
  const cfg: Record<string, string> = Object.fromEntries((rows ?? []).map((r: any) => [r.key, r.value]));
  if (req.headers.get('x-cron-secret') !== cfg.cron_secret) return new Response('unauthorized', { status: 401 });
  if (!cfg.resend_api_key || !cfg.from_email || !cfg.site_url) return Response.json({ ok: true, skipped: 'email_not_configured' });
  const site = cfg.site_url.replace(/\/$/, '');
  const { data: leads } = await db.from('web_leads').select('*').is('unsubscribed_at', null).gt('created_at', new Date(Date.now() - 400 * 864e5).toISOString()).order('created_at').limit(500);
  let sent = 0; const now = Date.now();
  for (const lead of leads ?? []) {
    if (sent >= MAX_PER_RUN) break;
    const unsub = `${site}/unsubscribe.html?t=${lead.unsub_token}`;
    const report = lead.report_id ? (await db.from('web_reports').select('id,inputs,picks').eq('id', lead.report_id).maybeSingle()).data : null;
    if (PRODUCT === 'unipath' && lead.intent === 'reminders') {
      if (!lead.intake && report?.inputs?.intake) lead.intake = report.inputs.intake;
      if (!lead.welcome_sent_at) {
        const m = upWelcome(lead, report, site);
        if (await send(cfg, lead, 'welcome', { ...m, html: withUnsub(m.html, unsub) }, unsub)) { await db.from('web_leads').update({ welcome_sent_at: new Date().toISOString(), intake: lead.intake, status: 'nurturing' }).eq('id', lead.id); sent++; }
        continue; // at most one email per lead per run
      }
      const plan = PLAN[lead.intake] ?? PLAN['unsure'];
      const created = new Date(lead.created_at).getTime();
      for (const [kind, when] of plan) {
        if (lead.reminders_sent.includes(kind)) continue;
        const due = typeof when === 'number' ? created + when * 864e5 : new Date(when + 'T09:00:00+10:00').getTime();
        if (due < created) { await db.from('web_leads').update({ reminders_sent: [...lead.reminders_sent, kind] }).eq('id', lead.id); lead.reminders_sent.push(kind); continue; } // already past at sign-up
        if (due > now) break;
        if (now - new Date(lead.welcome_sent_at).getTime() < 3 * 864e5) break; // space emails out
        const m = upReminder(kind, lead, report, site);
        if (await send(cfg, lead, kind, { ...m, html: withUnsub(m.html, unsub) }, unsub)) { await db.from('web_leads').update({ reminders_sent: [...lead.reminders_sent, kind] }).eq('id', lead.id); sent++; }
        break;
      }
      continue;
    }
    if (lead.welcome_sent_at) continue;
    let m: { subject: string; html: string } | null = null; let u: string | null = null;
    if (PRODUCT === 'emiq' && lead.intent === 'advisor_call') m = emCallAck(lead, report, site);
    if (lead.intent === 'premium_interest') { m = preorderAck(lead, site, unsub); u = unsub; }
    if (!m) continue;
    if (await send(cfg, lead, lead.intent + '_ack', m, u)) { await db.from('web_leads').update({ welcome_sent_at: new Date().toISOString() }).eq('id', lead.id); sent++; }
  }
  return Response.json({ ok: true, sent });
});
