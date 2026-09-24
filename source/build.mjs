// EmergingMarketIQ web — static site generator (no dependencies). Usage: node build.mjs
import fs from 'node:fs'; import path from 'node:path'; import url from 'node:url';
const ROOT = path.dirname(url.fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, 'src'), OUT = path.join(ROOT, 'site'), SHARED = path.join(ROOT, 'shared');
const SITE_URL = (process.env.SITE_URL || 'https://emergingmarketiq.github.io/ARIA').replace(/\/$/, '');
const CONFIG = { product: 'emiq', supabaseUrl: 'https://bznlmkaepbhrpflvdxix.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bmxta2FlcGJocnBmbHZkeGl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NDQyMzIsImV4cCI6MjA4OTMyMDIzMn0.c6FxwEmiRLAvXy5WkvLXVrIgPfO_GkpGHI6Mof0aKBA',
  siteUrl: process.env.SHARE_BASE ?? SITE_URL, debug: !!process.env.DEBUG };
const REVIEWED = 'March 2026';
const M = JSON.parse(fs.readFileSync(path.join(SRC, 'markets.json'), 'utf8'));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const usdK = (n) => (n == null ? '—' : n >= 1e6 ? 'US$' + (n / 1e6).toFixed(1) + 'M' : 'US$' + Math.round(n / 1000) + 'k');
fs.rmSync(OUT, { recursive: true, force: true });
const w = (p, s) => { const f = path.join(OUT, p); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); };
const MIX10 = [1, 5, 2, 2];
function cost10(c) { // 10-person professional-services team, same maths as the app
  const mid = (a, b) => (a + b) / 2; const n = 10;
  const base = mid(c.salary_senior_mgmt_min, c.salary_senior_mgmt_max) * MIX10[0] + mid(c.salary_professional_min, c.salary_professional_max) * MIX10[1] + mid(c.salary_admin_min, c.salary_admin_max) * MIX10[2] + mid(c.salary_support_min, c.salary_support_max) * MIX10[3];
  const people = Math.round(base + base * c.employer_social_pct / 100 + c.health_insurance_per_employee * n);
  const sqm = n * c.sqm_per_person, monthly = people + Math.round(sqm * c.office_grade_a_sqm) + Math.round(c.it_cost_per_employee * n);
  const setup = Math.round(c.company_registration_cost + c.legal_setup_cost + sqm * c.office_fitout_per_sqm);
  return { monthly, setup, firstYear: Math.round(monthly * 12 + c.annual_audit_cost + c.annual_tax_compliance_cost + setup + Math.ceil(n * 0.1) * c.visa_cost_per_expat) };
}
M.forEach((m) => { m.c10 = m.cost ? cost10(m.cost) : null; });

function layout({ title, desc, canonical, body, rel = '', scripts = '', jsonld = null, noindex = false }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">
${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${SITE_URL}/${canonical}">`}
<meta name="theme-color" content="#0A1F44">
<meta property="og:type" content="website"><meta property="og:site_name" content="EmergingMarketIQ">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${SITE_URL}/${canonical}"><meta property="og:image" content="${SITE_URL}/assets/og.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${rel}assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${rel}assets/base.css"><link rel="stylesheet" href="${rel}assets/theme.css">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ''}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-head"><div class="wrap">
<a class="brand" href="${rel}index.html"><span class="brand-mark" aria-hidden="true">E</span><span>EmergingMarket<span style="color:#2C4F9E">IQ</span></span></a>
<nav class="nav" aria-label="Main"><a class="hide-sm" href="${rel}markets/index.html">Market briefs</a><a class="hide-sm" href="${rel}index.html#how">Method</a><a class="btn btn-primary btn-sm" href="${rel}index.html#app" data-track="nav_cta">Start free</a></nav>
</div></header>
<main id="main">${body}</main>
<footer class="site-foot"><div class="wrap cols">
<div><b>EmergingMarketIQ</b><p>Market-entry intelligence for 24 emerging markets across the Gulf, South Asia, Southeast Asia and Africa. Decision support only — not legal, tax or investment advice.</p><p class="small">Country data reviewed ${REVIEWED}. Current conditions change quickly; verify before acting.</p></div>
<div><b>Explore</b><ul><li><a href="${rel}index.html#app">Market-entry analysis</a></li><li><a href="${rel}markets/index.html">All 24 market briefs</a></li><li><a href="https://play.google.com/store/apps/details?id=com.emergingmarketiq.app&utm_source=web&utm_medium=footer" rel="noopener" data-track="app_click">Android app</a></li></ul></div>
<div><b>Company</b><ul><li><a href="${rel}web-privacy.html">Website privacy</a></li><li><a href="${rel}privacy.html">App privacy policy</a></li><li><a href="mailto:supportmarketiq@gmail.com">Contact</a></li><li>© 2026 EmergingMarketIQ · Melbourne</li></ul></div>
</div></footer>
<script>window.ENGINE_CONFIG=${JSON.stringify(CONFIG)};</script>
<script src="${rel}assets/engine.js"></script>
${scripts}
</body></html>`;
}
const slim = M.map((m) => { const o = { ...m }; delete o.alerts; delete o.c10; delete o.talent_overview; delete o.entry_playbook_overview; delete o.current_conditions_outlook; return o; });
const dataScript = `<script>window.EM_MARKETS=${JSON.stringify(slim)};</script>`;
const regions = [...new Set(M.map((m) => m.region))];

w('index.html', layout({ canonical: '', title: 'Which emerging market should your business enter? — EmergingMarketIQ',
  desc: 'Free 60-second market-entry analysis across 24 emerging markets in the Gulf, South Asia, Southeast Asia and Africa: ranked fit, indicative first-year cost and an entry plan explained by ARIA.',
  jsonld: { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'EmergingMarketIQ market-entry analysis', applicationCategory: 'BusinessApplication', operatingSystem: 'Web, Android', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, url: SITE_URL + '/' },
  body: `
<section class="hero"><div class="wrap hero-grid">
  <div>
    <p class="eyebrow">For founders, SMEs, investors & advisors · Free</p>
    <h1>Which emerging market should your business <em>enter next?</em></h1>
    <p class="lede">Answer 7 questions. Get a ranked shortlist of 24 markets across the Gulf, South Asia, Southeast Asia and Africa — with fit scores, indicative first-year costs and an entry plan explained by ARIA.</p>
    <div class="hero-cta"><a class="btn btn-primary" href="#app" data-start data-track="hero_cta">Analyse my expansion — 60 seconds</a><a class="btn btn-ghost" href="markets/index.html" data-track="hero_briefs">Browse market briefs</a></div>
    <ul class="trust"><li>24 markets · 6 structural dimensions</li><li>Cost model per market</li><li>No sign-up</li></ul>
  </div>
  <div class="wizard-col" id="app"><div class="wizard" id="wizard" aria-live="polite"><noscript>The analysis needs JavaScript. You can still <a href="markets/index.html">read the market briefs</a>.</noscript></div><ul class="trust-under"><li>24 markets compared</li><li>Indicative costs</li><li><a href="markets/index.html">Market briefs</a></li></ul></div>
</div>
<div class="wrap"><div id="results" class="hidden" aria-live="polite"></div></div>
</section>
<section class="section section-alt" id="how"><div class="wrap">
  <p class="eyebrow">Method</p><h2>Transparent scoring, then an analyst’s explanation</h2>
  <div class="grid-3" style="margin-top:22px">
    <div class="card"><h3>1 · Structural fit</h3><p class="muted">Each market is scored 0–10 on regulatory quality, tax, openness to foreign investment, political stability, infrastructure and talent. We weight these by what you’re trying to do.</p></div>
    <div class="card"><h3>2 · Your constraints</h3><p class="muted">Sector priorities, current-conditions signals and your risk appetite adjust the score. A cost model estimates first-year spend for your team size.</p></div>
    <div class="card"><h3>3 · ARIA explains</h3><p class="muted">ARIA writes why each market fits, the main risk and a concrete first move — then answers your follow-up questions.</p></div>
  </div>
</div></section>
<section class="section"><div class="wrap">
  <p class="eyebrow">Market briefs</p><h2>24 markets, one consistent lens</h2>
  ${regions.map((r) => `<h3 style="margin-top:18px">${esc(r)}</h3><div class="pill-row">${M.filter((m) => m.region === r).map((m) => `<a class="pill" href="markets/${m.slug}.html">${esc(m.flag || '')} ${esc(m.name)}</a>`).join('')}</div>`).join('')}
</div></section>
<section class="section band"><div class="wrap" style="display:grid;gap:18px">
  <h2>Built by an operator, not a content farm</h2>
  <p class="muted" style="max-width:66ch">EmergingMarketIQ is built by a technology executive with 25+ years leading cross-border programs across ANZ, APAC, the Middle East and Africa. The goal: compress the first month of market-entry research into a few minutes, and be honest about what still needs local advice.</p>
  <a class="btn btn-primary" style="justify-self:start;background:#fff;color:#0A1F44" href="#app" data-start data-track="band_cta">Run the analysis</a>
</div></section>`,
  scripts: dataScript + '<script src="assets/app.js"></script>' }));

w('report.html', layout({ canonical: 'report.html', noindex: true, title: 'Shared market-entry analysis — EmergingMarketIQ', desc: 'A ranked emerging-market shortlist with indicative costs and an entry plan, generated by EmergingMarketIQ.',
  body: `<section class="section" style="padding-top:28px"><div class="wrap" style="max-width:900px"><div id="report" aria-live="polite"><span class="skeleton"></span><span class="skeleton w80"></span><span class="skeleton w60"></span></div></div></section>`,
  scripts: dataScript + '<script src="assets/report.js"></script>' }));

const sorted = [...M].sort((a, b) => b.score - a.score);
w('markets/index.html', layout({ rel: '../', canonical: 'markets/', title: 'Emerging market briefs: 24 markets compared for market entry (2026)',
  desc: 'Compare 24 emerging markets on regulatory quality, tax, foreign investment, political stability, infrastructure, talent and indicative setup cost.',
  body: `<section class="section" style="padding-top:20px"><div class="wrap">
  <nav class="breadcrumb"><a href="../index.html">Home</a> › Market briefs</nav>
  <h1 style="font-size:clamp(1.8rem,4.5vw,2.8rem)">Emerging markets compared for market entry</h1>
  <p class="muted" style="max-width:70ch">Structural scores (0–10) and an indicative first-year cost for a 10-person team. Data reviewed ${REVIEWED}. For a ranking weighted to your plan, <a href="../index.html#app">run the analysis</a>.</p>
  <div class="table-wrap" tabindex="0" role="region" aria-label="Scrollable table" style="margin-top:14px"><table><thead><tr><th>Market</th><th>Region</th><th class="num">Score</th><th>Risk</th><th class="num">Talent</th><th class="num">10-person first year</th><th>Current alert</th></tr></thead><tbody>
  ${sorted.map((m) => `<tr><td><a href="${m.slug}.html">${esc(m.flag || '')} ${esc(m.name)}</a></td><td>${esc(m.region)}</td><td class="num">${m.score}</td><td>${esc(m.risk)}</td><td class="num">${m.dim_talent}</td><td class="num">${usdK(m.c10?.firstYear)}</td><td>${m.geopolitical_alert_level && m.geopolitical_alert_level !== 'None' ? `<span class="sev sev-${esc(m.geopolitical_alert_level)}">${esc(m.geopolitical_alert_level)}</span>` : '—'}</td></tr>`).join('')}
  </tbody></table></div>
  <p class="notice">Scores and costs from EmergingMarketIQ’s dataset, reviewed ${REVIEWED}. Indicative only — verify with local advisors.</p>
</div></section>` }));

const DIMN = [['dim_regulatory', 'Regulatory'], ['dim_tax', 'Tax'], ['dim_foreign_investment', 'Foreign investment'], ['dim_political_stability', 'Political stability'], ['dim_infrastructure', 'Infrastructure'], ['dim_talent', 'Talent']];
for (const m of M) {
  const peers = M.filter((x) => x.region === m.region && x.name !== m.name);
  const alert = m.geopolitical_alert_level && m.geopolitical_alert_level !== 'None';
  const inds = [1, 2, 3, 4].map((i) => ({ n: m[`key_industry_${i}_name`], d: m[`key_industry_${i}_desc`], t: m[`key_industry_${i}_trend`], inv: m[`key_industry_${i}_investors`] })).filter((x) => x.n);
  const faq = [
    [`Is ${m.name} a good market to enter in 2026?`, `${m.name} scores ${m.score}/10 on EmergingMarketIQ’s structural index (risk: ${m.risk}). ${m.summary}. Current-conditions score: ${m.current_conditions_score}/10 (${m.current_conditions_summary}) — reviewed ${REVIEWED}.`],
    ...(m.c10 ? [[`How much does it cost to set up a 10-person office in ${m.name}?`, `Our cost model estimates about ${usdK(m.c10.firstYear)} for the first year (≈${usdK(m.c10.monthly)} per month run-rate plus ≈${usdK(m.c10.setup)} one-off setup) for a 10-person professional-services team. Indicative only.`]] : []),
    [`What are the first steps to set up a company in ${m.name}?`, [m.entry_step_1, m.entry_step_2, m.entry_step_3, m.entry_step_4].filter(Boolean).join(' Then: ')],
  ];
  w(`markets/${m.slug}.html`, layout({ rel: '../', canonical: `markets/${m.slug}.html`,
    title: `Doing business in ${m.name} (2026): market-entry brief, costs & first steps`,
    desc: `${m.name} market-entry brief: structural score ${m.score}/10, key sectors, talent and foreign-worker rules, entry steps and an indicative ${m.c10 ? usdK(m.c10.firstYear) : ''} first-year cost for a 10-person team.`,
    jsonld: [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
      { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL + '/' }, { '@type': 'ListItem', position: 2, name: 'Market briefs', item: SITE_URL + '/markets/' }, { '@type': 'ListItem', position: 3, name: m.name }] }],
    body: `<section class="section" style="padding-top:20px"><div class="wrap">
  <nav class="breadcrumb"><a href="../index.html">Home</a> › <a href="index.html">Market briefs</a> › ${esc(m.name)}</nav>
  <p class="eyebrow">${esc(m.region)} · reviewed ${REVIEWED}</p>
  <h1 style="font-size:clamp(1.8rem,4.5vw,2.8rem)">${esc(m.flag || '')} Doing business in ${esc(m.name)}</h1>
  <p class="lede muted" style="font-size:1.1rem">${esc(m.summary)}.</p>
  ${alert ? `<div class="card" style="border-color:#F5C9A8;background:#FFF7F0;margin:12px 0"><b class="sev sev-${esc(m.geopolitical_alert_level)}">Current-conditions alert (${esc(m.geopolitical_alert_level)}, ${esc(m.geopolitical_alert_date || REVIEWED)}):</b> ${esc(m.geopolitical_alert)}<p class="small muted" style="margin:6px 0 0">This signal may be out of date — check current advisories before acting.</p></div>` : ''}
  <div class="kpis" style="margin:18px 0">
    <div class="kpi"><b>${m.score}/10</b><span>structural score · risk ${esc(m.risk)}</span></div>
    <div class="kpi"><b>${m.current_conditions_score}/10</b><span>current conditions</span></div>
    <div class="kpi"><b>${usdK(m.c10?.firstYear)}</b><span>first year, 10-person team (indicative)</span></div>
    <div class="kpi"><b>${esc(m.gdp || '—')}</b><span>GDP · pop. ${esc(m.population || '—')}</span></div>
  </div>
  <div class="card" style="margin-bottom:18px;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between"><div><b>Is ${esc(m.name)} right for your plan?</b><div class="small muted">Compare it with 23 other markets for your industry, budget and risk appetite.</div></div><a class="btn btn-primary" href="../index.html#app" data-track="market_cta" data-label="${esc(m.name)}">Analyse my expansion</a></div>
  <div class="grid-3" style="grid-template-columns:1fr">
  <div class="card"><h2 style="font-size:1.3rem">Structural scores</h2><div class="dims">${DIMN.map(([k, l]) => `<div class="dim"><span>${l}</span><i style="--v:${m[k]}"></i><b>${m[k]}</b></div>`).join('')}</div>
  <p class="small muted" style="margin-top:8px">Highlights: ${[m.highlight_1, m.highlight_2, m.highlight_3].filter(Boolean).map(esc).join(' · ')}</p></div>
  <div class="card"><h2 style="font-size:1.3rem">Key industries</h2>${inds.map((x) => `<h3 style="font-size:1.02rem;margin-top:12px">${esc(x.n)} <span class="badge">${esc(x.t || '')}</span></h3><p class="muted" style="margin:.2em 0">${esc(x.d)}</p><p class="small muted">Main investors: ${esc(x.inv)}</p>`).join('')}</div>
  <div class="card"><h2 style="font-size:1.3rem">Sector priorities</h2><ol>${[1, 2, 3].map((i) => m[`sector_priority_${i}`] ? `<li><b>${esc(m[`sector_priority_${i}`])}</b> — ${esc(m[`sector_priority_${i}_why`])}</li>` : '').join('')}</ol></div>
  <div class="card"><h2 style="font-size:1.3rem">Talent & work permits</h2><p>${esc(m.talent_overview)}</p><ul><li><b>Foreign workers:</b> ${esc(m.talent_foreign_worker_rule)}</li><li><b>Localisation:</b> ${esc(m.talent_localisation_rule)}</li><li><b>Key consideration:</b> ${esc(m.talent_key_consideration)}</li></ul></div>
  <div class="card"><h2 style="font-size:1.3rem">How to enter: first four steps</h2><p class="muted">${esc(m.entry_playbook_overview)}</p><ol class="steps">${[1, 2, 3, 4].map((i) => m[`entry_step_${i}`] ? `<li>${esc(m[`entry_step_${i}`])}</li>` : '').join('')}</ol></div>
  ${m.c10 ? `<div class="card"><h2 style="font-size:1.3rem">Indicative cost: 10-person team</h2><div class="kpis"><div class="kpi"><b>${usdK(m.c10.monthly)}</b><span>monthly run-rate</span></div><div class="kpi"><b>${usdK(m.c10.setup)}</b><span>one-off setup</span></div><div class="kpi"><b>${usdK(m.c10.firstYear)}</b><span>first year all-in</span></div><div class="kpi"><b>${esc(m.cost.local_currency)}</b><span>local currency</span></div></div><p class="small muted" style="margin-top:10px">Professional-services mix (1 senior, 5 professional, 2 admin, 2 support), Grade-A office, registration, legal, audit and tax compliance. Model estimate, not a quote. <a href="../index.html#app">Model your own team size and industry →</a></p></div>` : ''}
  ${m.alerts?.length ? `<div class="card"><h2 style="font-size:1.3rem">Regulatory watch</h2><ul>${m.alerts.map((a) => `<li><b>${esc(a.alert_date)} · ${esc(a.title)}</b> — ${esc(a.summary)}</li>`).join('')}</ul></div>` : ''}
  </div>
  <h2 style="font-size:1.3rem;margin-top:24px">Compare with ${esc(m.region)} peers</h2>
  <div class="pill-row">${peers.map((p) => `<a class="pill" href="${p.slug}.html">${esc(p.flag || '')} ${esc(p.name)} · ${p.score}</a>`).join('')}</div>
  <h2 style="font-size:1.3rem;margin-top:24px">Common questions</h2>
  ${faq.map(([q, a]) => `<details class="card" style="margin-bottom:10px"><summary><b>${esc(q)}</b></summary><p style="margin-top:10px">${esc(a)}</p></details>`).join('')}
  <p class="notice">Source: EmergingMarketIQ country dataset, reviewed ${REVIEWED}. Rules, rates and conditions change — verify with local counsel before acting. Not legal, tax or investment advice.</p>
</div></section>` }));
}
w('web-privacy.html', layout({ canonical: 'web-privacy.html', title: 'Privacy — EmergingMarketIQ web', desc: 'How the EmergingMarketIQ website handles your data.', body: `<section class="section"><div class="wrap" style="max-width:760px"><h1 style="font-size:2rem">Privacy on the EmergingMarketIQ website</h1>
<p>This page covers the website. The Android app’s policy is <a href="https://mustansiryaqub.github.io/emergingmarketiq-privacy/">here</a>. Operator: EmergingMarketIQ, Melbourne, Australia · supportmarketiq@gmail.com.</p>
<h2 style="font-size:1.3rem">What we collect</h2><ul><li><b>Your analysis answers and shortlist</b> — stored so your report link works and to improve the model. They don’t identify you.</li><li><b>Usage analytics</b> — page views, clicks, device type, language, time zone, referrer and campaign tags, linked to a random ID in your browser. No cookies or ad trackers; IP addresses are not stored (a one-way hash is used for abuse limits).</li><li><b>Your email</b> — only if you submit it, for the purpose you chose.</li></ul>
<h2 style="font-size:1.3rem">AI processing</h2><p>Your answers and shortlist (never your email) are sent to Anthropic’s Claude API to write ARIA’s analysis.</p>
<h2 style="font-size:1.3rem">Your choices</h2><p>Email us to access or delete your data.</p></div></section>` }));

w('unsubscribe.html', layout({ canonical: 'unsubscribe.html', noindex: true, title: 'Unsubscribe', desc: 'Unsubscribe from emails', body: `<section class="section"><div class="wrap" style="max-width:640px"><h1 style="font-size:2rem">Unsubscribe</h1><p id="u-msg" class="muted">One moment…</p></div></section>`,
  scripts: `<script>(function(){var t=new URLSearchParams(location.search).get('t')||'',m=document.getElementById('u-msg');if(!/^[0-9a-f]{32}$/.test(t)){m.textContent='This unsubscribe link is not valid. Reply to any of our emails and we will remove you.';return;}Engine.fn('web-leads',{action:'unsub',token:t}).then(function(r){m.textContent=r&&r.ok?'You have been unsubscribed. You will not receive further emails from us.':'Sorry, something went wrong. Reply to any of our emails and we will remove you.';Engine.track('unsubscribe',{ok:!!(r&&r.ok)});}).catch(function(){m.textContent='Connection problem — please try again.';});})();</script>` }));
w('404.html', layout({ canonical: '404.html', noindex: true, title: 'Page not found — EmergingMarketIQ', desc: 'Not found', body: '<section class="section"><div class="wrap"><h1>Page not found</h1><p><a class="btn btn-primary" href="index.html#app">Run the analysis</a></p></div></section>' }));
const pages = ['', 'markets/', ...M.map((m) => `markets/${m.slug}.html`), 'web-privacy.html'];
w('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((p) => `<url><loc>${SITE_URL}/${p}</loc><lastmod>2026-09-24</lastmod></url>`).join('\n')}\n</urlset>\n`);
w('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });
for (const f of ['engine.js', 'base.css']) fs.copyFileSync(path.join(SHARED, f), path.join(OUT, 'assets', f));
for (const f of ['app.js', 'report.js', 'theme.css', 'favicon.svg', 'og.png']) fs.copyFileSync(path.join(SRC, f), path.join(OUT, 'assets', f));
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
console.log(`built ${pages.length + 2} pages → ${OUT}`);
