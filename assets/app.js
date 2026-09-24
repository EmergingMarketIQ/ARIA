/* EmergingMarketIQ web — "Which emerging market should my business enter?" */
(function () {
  'use strict';
  var E = window.Engine, esc = E.esc, M = window.EM_MARKETS;
  var usd = function (n) { return n == null ? '—' : 'US$' + Math.round(n).toLocaleString('en-US'); };
  var usdK = function (n) { return n == null ? '—' : n >= 1e6 ? 'US$' + (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + 'M' : 'US$' + Math.round(n / 1000) + 'k'; };
  var REGIONS = ['GCC Markets', 'South Asia', 'Southeast Asia', 'Broader MEA', 'Frontier & Gateway'];
  var STEPS = [
    { key: 'objective', q: 'What are you trying to do?', cls: 'one', opts: [
      { v: 'sell', t: 'Sell into a new market', s: 'Win customers, open a sales office', i: '🎯' },
      { v: 'delivery', t: 'Build an offshore team', s: 'Delivery, capability or back-office centre', i: '🧑‍💻' },
      { v: 'manufacture', t: 'Manufacture or move supply chain', s: 'China+1, plant or sourcing hub', i: '🏭' },
      { v: 'hq', t: 'Set up a regional HQ', s: 'Holding, treasury or leadership base', i: '🏢' },
      { v: 'invest', t: 'Invest in or acquire a business', s: 'M&A, JV or portfolio investment', i: '💼' }] },
    { key: 'industry', q: 'Your industry?', cls: '', opts: [
      { v: 'technology', t: 'Technology & software', i: '💻' }, { v: 'professional_services', t: 'Professional services', i: '📊' }, { v: 'financial_services', t: 'Financial services & fintech', i: '🏦' },
      { v: 'manufacturing', t: 'Manufacturing & industrial', i: '⚙️' }, { v: 'trading', t: 'Trade, retail & distribution', i: '📦' }, { v: 'energy', t: 'Energy & resources', i: '⚡' }, { v: 'healthcare', t: 'Healthcare & life sciences', i: '🧬' }] },
    { key: 'regions', q: 'Which regions are you considering?', help: 'Choose any — or leave open and let ARIA compare all 24 markets.', multi: true, cls: '', opts: REGIONS.map(function (r) { return { v: r, t: r }; }) },
    { key: 'size', q: 'Team size in year one?', cls: 'three', opts: [{ v: '5', t: '~5 people' }, { v: '10', t: '~10' }, { v: '25', t: '~25' }, { v: '50', t: '~50' }, { v: '100', t: '100+' }] },
    { key: 'budget', q: 'First-year budget for this market?', help: 'All-in: people, office, setup and compliance.', cls: '', opts: [{ v: 'lt250k', t: 'Under US$250k' }, { v: '250k-1m', t: 'US$250k–1M' }, { v: '1m-3m', t: 'US$1–3M' }, { v: 'gt3m', t: 'Over US$3M' }, { v: 'unsure', t: 'Not sure yet' }] },
    { key: 'risk', q: 'Risk appetite?', cls: 'one', opts: [{ v: 'low', t: 'Low', s: 'Stability first — avoid elevated current risks', i: '🛡️' }, { v: 'balanced', t: 'Balanced', s: 'Trade some risk for growth', i: '⚖️' }, { v: 'high', t: 'High', s: 'Growth first — we can manage volatility', i: '🚀' }] },
    { key: 'home', q: 'Where is your company headquartered?', cls: '', opts: ['Australia', 'United Kingdom', 'United States', 'Singapore', 'Germany', 'Canada', 'India', 'Other'].map(function (h) { return { v: h, t: h }; }) }
  ];
  var W = { // weights over [regulatory, tax, foreign investment, political stability, infrastructure, talent]
    sell: [.20, .10, .25, .20, .15, .10], delivery: [.15, .15, .10, .15, .15, .30], manufacture: [.15, .15, .15, .15, .30, .10],
    hq: [.25, .25, .15, .25, .10, 0], invest: [.20, .15, .30, .25, .05, .05] };
  var KW = { technology: /tech|software|digital|\bit\b|fintech|data|\bai\b|semiconductor|electronics/i, professional_services: /professional|services|consult|outsourc|bpo|capability|business/i,
    financial_services: /financ|bank|fintech|insur|capital|islamic/i, manufacturing: /manufactur|industrial|electronics|automotive|textile|garment|steel|chemical/i,
    trading: /trade|trading|retail|logistic|distribution|commerce|consumer|port/i, energy: /energy|oil|gas|renewable|solar|wind|mining|hydrogen|petro|mineral/i,
    healthcare: /health|pharma|medical|life science|biotech/i };
  var MIX = { '5': [1, 2, 1, 1], '10': [1, 5, 2, 2], '25': [3, 12, 6, 4], '50': [6, 25, 12, 7], '100': [12, 50, 25, 13] };
  var MULT = { technology: 'multiplier_technology', professional_services: 'multiplier_professional_services', financial_services: 'multiplier_financial_services', manufacturing: 'multiplier_manufacturing', trading: 'multiplier_trading', energy: 'multiplier_manufacturing', healthcare: 'multiplier_professional_services' };
  var CAP = { lt250k: 250000, '250k-1m': 1000000, '1m-3m': 3000000, gt3m: Infinity, unsure: Infinity };

  function cost(c, size, industry) { // port of the app's costCalculator (same maths as the server)
    if (!c) return null; var mult = c[MULT[industry]] || 1, m = MIX[size] || MIX['10'], n = +size;
    var mid = function (a, b) { return (a + b) / 2 * mult; };
    var base = mid(c.salary_senior_mgmt_min, c.salary_senior_mgmt_max) * m[0] + mid(c.salary_professional_min, c.salary_professional_max) * m[1] + mid(c.salary_admin_min, c.salary_admin_max) * m[2] + mid(c.salary_support_min, c.salary_support_max) * m[3];
    var people = Math.round(base + base * c.employer_social_pct / 100 + c.health_insurance_per_employee * n);
    var sqm = n * c.sqm_per_person, monthly = people + Math.round(sqm * c.office_grade_a_sqm) + Math.round(c.it_cost_per_employee * n);
    var setup = Math.round(c.company_registration_cost + c.legal_setup_cost + sqm * c.office_fitout_per_sqm);
    var firstYear = Math.round(monthly * 12 + c.annual_audit_cost + c.annual_tax_compliance_cost + setup + Math.ceil(n * .1) * c.visa_cost_per_expat);
    return { monthly: monthly, setup: setup, firstYear: firstYear };
  }
  function dims(m) { return [m.dim_regulatory, m.dim_tax, m.dim_foreign_investment, m.dim_political_stability, m.dim_infrastructure, m.dim_talent].map(Number); }
  function rank(a) {
    var w = W[a.objective], cap = CAP[a.budget], kw = KW[a.industry];
    var pool = M.filter(function (m) { return !a.regions.length || a.regions.indexOf(m.region) > -1; });
    if (pool.length < 3) pool = M;
    var list = pool.map(function (m) {
      var d = dims(m), base = 0; for (var i = 0; i < 6; i++) base += w[i] * d[i]; base *= 10;
      var sectors = [m.sector_priority_1, m.sector_priority_2, m.sector_priority_3].join(' | '), inds = [m.key_industry_1_name, m.key_industry_2_name, m.key_industry_3_name, m.key_industry_4_name, m.main_industries].join(' | ');
      var ind = kw.test(sectors) ? 8 : kw.test(inds) ? 4 : 0;
      var cur = Number(m.current_conditions_score), gap = Number(m.score) - cur, lvl = m.geopolitical_alert_level;
      var riskAdj = a.risk === 'low' ? -(gap * 6 + (m.risk === 'High' ? 8 : m.risk === 'Medium' ? 3 : 0)) : a.risk === 'balanced' ? -(gap * 3 + (m.risk === 'High' ? 3 : 0)) : 0;
      var cst = cost(m.cost, a.size, a.industry), over = cst && cap !== Infinity && cst.firstYear > cap;
      var budAdj = over ? -Math.min(15, (cst.firstYear - cap) / cap * 20) : 0;
      if (a.objective === 'delivery' && cst) budAdj += Math.max(-4, Math.min(4, (1500000 - cst.firstYear * (10 / +a.size)) / 400000)); // cost matters more for offshore teams
      var fit = Math.max(5, Math.min(97, Math.round(base + ind + riskAdj + budAdj)));
      return { m: m, fit: fit, cost: cst, over: over, industryMatch: ind, alert: lvl && lvl !== 'None' ? lvl : null };
    });
    list.sort(function (x, y) { return y.fit - x.fit; });
    return list;
  }

  var state = { step: 0, a: { regions: [] }, started: false, list: null, report: null };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var wz = $('#wizard'), out = $('#results');
  function renderStep() {
    var s = STEPS[state.step];
    var sel = function (v) { return s.multi ? state.a.regions.indexOf(v) > -1 : state.a[s.key] === v; };
    wz.innerHTML = '<div class="wz-top"><div class="wz-progress" aria-hidden="true"><i style="width:' + Math.round(state.step / STEPS.length * 100) + '%"></i></div><span class="wz-step-label">Step ' + (state.step + 1) + ' of ' + STEPS.length + '</span></div>' +
      '<h2 class="wz-q" id="wzq" tabindex="-1">' + esc(s.q) + '</h2>' + (s.help ? '<p class="wz-help">' + esc(s.help) + '</p>' : '') +
      '<div class="opts ' + s.cls + '" role="group" aria-labelledby="wzq">' + s.opts.map(function (o) {
        return '<button type="button" class="opt" ' + (s.multi ? 'role="checkbox" aria-checked="' : 'aria-pressed="') + sel(o.v) + '" data-v="' + esc(o.v) + '">' + (o.i ? '<span class="ico" aria-hidden="true">' + o.i + '</span>' : '') + '<span>' + esc(o.t) + (o.s ? '<small>' + esc(o.s) + '</small>' : '') + '</span></button>';
      }).join('') + '</div>' +
      '<div class="wz-nav">' + (state.step > 0 ? '<button type="button" class="linkbtn" id="wzBack">← Back</button>' : '<span class="small muted">No sign-up · free · 60 seconds</span>') +
      (s.multi ? '<button type="button" class="btn btn-primary btn-sm" id="wzNext">' + (state.a.regions.length ? 'Continue' : 'Compare all regions') + ' →</button>' : '<span></span>') + '</div>';
    wz.querySelectorAll('.opt').forEach(function (b) { b.addEventListener('click', function () { choose(s, b.dataset.v, b); }); });
    var back = $('#wzBack'); if (back) back.onclick = function () { state.step--; renderStep(); };
    var nx = $('#wzNext'); if (nx) nx.onclick = function () { E.track('wizard_step', { step: state.step + 1, key: 'regions', value: state.a.regions.join(',') || 'all' }); advance(); };
    if (state.started) $('#wzq').focus({ preventScroll: true });
  }
  function choose(s, v, btn) {
    if (!state.started) { state.started = true; E.track('wizard_start', { first: s.key }); }
    if (s.multi) { var i = state.a.regions.indexOf(v); if (i > -1) state.a.regions.splice(i, 1); else state.a.regions.push(v); btn.setAttribute('aria-checked', i === -1); $('#wzNext').textContent = (state.a.regions.length ? 'Continue' : 'Compare all regions') + ' →'; return; }
    state.a[s.key] = v; E.track('wizard_step', { step: state.step + 1, key: s.key, value: v }); advance();
  }
  function advance() { if (state.step < STEPS.length - 1) { state.step++; renderStep(); } else finish(); }
  function finish() {
    E.track('wizard_complete', state.a);
    state.list = rank(state.a); renderResults(); requestNarrative();
  }
  var DIMN = ['Regulatory', 'Tax', 'Foreign investment', 'Political stability', 'Infrastructure', 'Talent'];
  function card(x, i) {
    var m = x.m, d = dims(m);
    return '<article class="pick" id="m-' + esc(m.slug) + '"><div class="pick-top"><div><div class="small muted">#' + (i + 1) + ' · ' + esc(m.region) + '</div><h3>' + esc(m.flag || '') + ' ' + esc(m.name) + '</h3><div class="sub">' + esc(m.summary || '') + '</div></div>' +
      '<div class="fit" style="--v:' + x.fit + '" aria-label="Fit ' + x.fit + ' out of 100"><b>' + x.fit + '</b><span>fit</span></div></div>' +
      '<ul class="facts"><li>First year ≈ <b>' + usdK(x.cost && x.cost.firstYear) + '</b></li><li>Run-rate ≈ <b>' + usdK(x.cost && x.cost.monthly) + '</b>/mo</li><li>Setup ≈ ' + usdK(x.cost && x.cost.setup) + '</li><li>Structural score <b>' + esc(m.score) + '</b>/10 · risk ' + esc(m.risk) + '</li></ul>' +
      '<div>' + (x.over ? '<span class="badge warn">Above your budget</span> ' : (state.a.budget !== 'unsure' ? '<span class="badge good">Within budget</span> ' : '')) + (x.industryMatch >= 8 ? '<span class="badge good">Priority sector for your industry</span> ' : x.industryMatch ? '<span class="badge">Industry present</span> ' : '') + (x.alert ? '<span class="badge warn">Current-conditions alert: ' + esc(x.alert) + '</span>' : '') + '</div>' +
      '<details style="margin-top:10px"><summary class="small"><b>Score breakdown & entry steps</b></summary><div class="dims">' + d.map(function (v, k) { return '<div class="dim"><span>' + DIMN[k] + '</span><i style="--v:' + v + '"></i><b>' + v + '</b></div>'; }).join('') + '</div>' +
      '<ol class="small" style="padding-left:18px;margin:10px 0 0">' + [m.entry_step_1, m.entry_step_2, m.entry_step_3, m.entry_step_4].filter(Boolean).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol><p class="small" style="margin-top:8px"><a href="markets/' + esc(m.slug) + '.html">Full ' + esc(m.name) + ' market brief →</a></p></details>' +
      '<div class="aria" data-aria="' + esc(m.name) + '"><div class="who">ARIA</div><span class="skeleton"></span><span class="skeleton w80"></span></div></article>';
  }
  function renderResults(fromReport) {
    var top = state.list.slice(0, 3), a = state.a;
    out.innerHTML = '<div class="results-head"><div><p class="eyebrow">Your market shortlist</p><h2 id="resTitle" tabindex="-1">Top 3 markets for your ' + ({ sell: 'market-entry', delivery: 'offshore team', manufacture: 'manufacturing', hq: 'regional HQ', invest: 'investment' })[a.objective] + ' plan</h2>' +
      '<p class="muted small">Scored across ' + state.list.length + ' markets on six structural dimensions, current conditions, sector fit and your budget. Indicative costs for ~' + esc(a.size) + ' people.</p></div>' +
      '<div class="sharebar no-print"><button class="btn btn-ghost btn-sm" id="restart">Edit answers</button><button class="btn btn-ghost btn-sm" onclick="window.print()" data-track="print_click">Save as PDF</button></div></div>' +
      '<div class="summary" id="ariaSummary" aria-live="polite"><div class="who eyebrow">ARIA’s read</div><span class="skeleton"></span><span class="skeleton w80"></span><span class="skeleton w60"></span></div>' +
      '<div class="rank">' + top.map(card).join('') + '</div>' +
      '<div class="cta-panel no-print" style="margin-top:16px">' +
        '<div class="card"><h3>Talk it through with an expansion advisor</h3><p class="muted small">Free 20-minute call to pressure-test this shortlist with someone who has led cross-border deals across ANZ, APAC and the Middle East. No obligation.</p>' +
        '<form class="call-form" data-lead="advisor_call" data-done="Thanks — request received. You\u2019ll get a confirmation email now and a calendar invite with a Google Meet link, usually within one business day.">' +
          '<div class="fgrid"><label>Your name<input name="name" required maxlength="120" autocomplete="name"></label><label>Work email<input type="email" name="email" required autocomplete="email"></label>' +
          '<label>Company<input name="company" maxlength="160" autocomplete="organization"></label><label>Best time for you<select name="preferred_times"><option value="">Any time</option><option>Morning (your time)</option><option>Afternoon (your time)</option><option>Evening (your time)</option></select></label></div>' +
          '<label class="full">What would you like to discuss?<textarea name="message" rows="3" maxlength="1000" placeholder="e.g. Choosing between Vietnam and Malaysia for a 25-person engineering team"></textarea></label>' +
          '<label class="consent"><input type="checkbox" name="consent"> Send me the monthly emerging-markets brief</label><button class="btn btn-primary btn-sm" type="submit">Request a call</button><p class="form-msg"></p></form></div>' +
        '<div class="card"><h3>Share with your team</h3><p class="muted small">The link opens this exact analysis — useful for a board paper or a quick sanity check with a colleague.</p><div class="sharebar"><button class="btn btn-primary btn-sm" data-share="linkedin">LinkedIn</button><button class="btn btn-ghost btn-sm" data-share="email">Email</button><button class="btn btn-ghost btn-sm" data-share="whatsapp">WhatsApp</button><button class="btn btn-ghost btn-sm" data-share="copy">Copy link</button></div><p class="small muted" id="shareHint" style="margin-top:8px">Preparing your share link…</p></div>' +
      '</div>' +
      '<div class="card no-print" style="margin-top:16px"><h3>Ask ARIA about this shortlist</h3><p class="muted small">3 free follow-up questions — e.g. “What would change if we chose a free zone in the UAE?”</p><form class="ask" id="askForm"><label class="sr-only" for="askQ">Your question</label><input id="askQ" maxlength="300" placeholder="Ask a question…" required><button class="btn btn-primary btn-sm" type="submit">Ask</button></form><div id="answers"></div></div>' +
      '<div class="card" style="margin-top:16px"><h3>Next steps</h3><ol class="steps" id="nextSteps"><li>Validate tax and entity structure with local counsel.</li><li>Get two quotes for office and employer-of-record options.</li><li>Pressure-test the talent assumptions with a local recruiter.</li></ol><p class="small muted" id="costNote" style="margin-top:12px"></p></div>' +
      '<div class="card no-print" style="margin-top:16px"><h3>Need the detail for an investment committee?</h3><p class="muted small">Deep-dive report for one market: tax & treasury, legal & regulatory, compliance & risk, cost model and 90-day entry plan. <b>US$149</b> — pre-order and we’ll deliver within 5 business days of launch. Nothing is charged today.</p>' +
      '<form class="inline-form" data-lead="premium_interest" data-price="USD149" data-done="Noted — you’re on the pre-order list. We’ll email before anything is charged."><label class="sr-only" for="em2">Email</label><input type="email" id="em2" name="email" placeholder="you@company.com" required><button class="btn btn-ghost btn-sm" type="submit" data-track="premium_interest">Pre-order interest</button><p class="form-msg"></p></form></div>' +
      '<details class="card no-print" style="margin-top:16px" id="allMk"><summary><b>Full ranking of ' + state.list.length + ' markets</b></summary><div class="table-wrap" tabindex="0" role="region" aria-label="Scrollable table" style="margin-top:12px"><table><thead><tr><th>Market</th><th>Region</th><th class="num">Fit</th><th class="num">First year</th><th>Alert</th></tr></thead><tbody>' +
        state.list.map(function (x) { return '<tr><td><a href="markets/' + esc(x.m.slug) + '.html">' + esc(x.m.flag || '') + ' ' + esc(x.m.name) + '</a></td><td>' + esc(x.m.region) + '</td><td class="num">' + x.fit + '</td><td class="num">' + usdK(x.cost && x.cost.firstYear) + '</td><td>' + (x.alert ? '<span class="sev sev-' + esc(x.alert) + '">' + esc(x.alert) + '</span>' : '—') + '</td></tr>'; }).join('') + '</tbody></table></div></details>' +
      '<p class="notice">Current conditions updated 24 Sep 2026 (structural scores March 2026); geopolitical signals change quickly — verify before acting. Costs are indicative model estimates (USD), not quotes. Decision support only — not legal, tax or investment advice.</p>';
    out.classList.remove('hidden'); $('.hero-grid').classList.add('hidden');
    $('#restart').onclick = restart;
    out.querySelectorAll('[data-share]').forEach(function (b) { b.addEventListener('click', function () { doShare(b.dataset.share); }); });
    $('#askForm').addEventListener('submit', ask);
    $('#allMk').addEventListener('toggle', function (e) { if (e.target.open) E.track('full_ranking_open', {}); }, { once: true });
    E.bindLeadForms(out, function () { return { report_id: state.report, note: [a.objective, a.industry, a.size, a.budget, top.map(function (x) { return x.m.name; }).join('/')].join('|') }; });
    E.track('result_view', { top: top.map(function (x) { return x.m.name; }), objective: a.objective, industry: a.industry });
    window.scrollTo({ top: out.getBoundingClientRect().top + window.scrollY - 70, behavior: 'smooth' }); $('#resTitle').focus({ preventScroll: true });
  }
  function label(k, v) { var s = STEPS.filter(function (x) { return x.key === k; })[0]; var o = s && s.opts.filter(function (x) { return x.v === v; })[0]; return o ? o.t : v; }
  function requestNarrative() {
    var t0 = Date.now(), a = state.a;
    var inputs = { objective: a.objective, industry: a.industry, regions: a.regions, size: a.size, budget: a.budget, risk: a.risk, home: a.home };
    E.api({ action: 'generate', inputs: inputs, picks: state.list.slice(0, 3).map(function (x) { return { country: x.m.name, score: x.fit }; }) }).then(function (r) {
      if (r.id) { state.report = r.id; history.replaceState(null, '', location.pathname + '?r=' + r.id); $('#shareHint').textContent = 'Link ready: ' + E.reportUrl(r.id).split('&utm')[0]; }
      else $('#shareHint').textContent = 'Sharing is unavailable right now.';
      if (r.narrative) { paint(r.narrative); E.track('aria_complete', { ms: Date.now() - t0, cached: !!r.cached, report_id: r.id }); }
      else { $('#ariaSummary').innerHTML = '<p>' + esc(r.message || 'ARIA couldn’t write the explanation just now — the ranking above is still valid.') + '</p>'; out.querySelectorAll('.aria').forEach(function (s) { s.remove(); }); E.track('aria_error', { status: r._status, error: r.error }); }
    });
  }
  function paint(n) {
    $('#ariaSummary').innerHTML = '<div class="who eyebrow">ARIA’s read</div><h2>' + esc(n.headline) + '</h2><p>' + esc(n.summary) + '</p>';
    (n.markets || []).forEach(function (x) {
      var el = out.querySelector('[data-aria="' + (window.CSS && CSS.escape ? CSS.escape(x.country) : x.country) + '"]');
      if (el) el.innerHTML = '<div class="who">ARIA</div><p>' + esc(x.why) + '</p>' + (x.risk ? '<p class="check"><b>Main risk:</b> ' + esc(x.risk) + '</p>' : '') + (x.first_move ? '<p class="check"><b>First move:</b> ' + esc(x.first_move) + '</p>' : '');
    });
    out.querySelectorAll('.aria .skeleton').forEach(function (s) { s.parentNode.remove(); });
    if (n.next_steps) $('#nextSteps').innerHTML = n.next_steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('');
    if (n.cost_note) $('#costNote').textContent = n.cost_note;
  }
  function doShare(ch) {
    if (!state.report) { E.toast('Share link is still being prepared…'); return; }
    E.share({ channel: ch, id: state.report, url: E.reportUrl(state.report), title: 'Emerging-market shortlist: ' + state.list.slice(0, 3).map(function (x) { return x.m.name; }).join(', '), text: 'Our emerging-market entry shortlist from EmergingMarketIQ:' });
  }
  function ask(e) {
    e.preventDefault(); var q = $('#askQ').value.trim(); if (!q) return;
    if (!state.report) { E.toast('One moment — ARIA is still preparing your report.'); return; }
    var box = document.createElement('div'); box.className = 'answer'; box.innerHTML = '<b>You:</b> ' + esc(q) + '\n<span class="skeleton"></span>'; $('#answers').appendChild(box);
    $('#askQ').value = ''; E.track('followup_ask', { report_id: state.report, len: q.length });
    E.api({ action: 'followup', id: state.report, question: q }).then(function (r) {
      box.innerHTML = '<b>You:</b> ' + esc(q) + '\n\n<b>ARIA:</b> ' + esc(r.answer || r.message || 'Sorry, I couldn’t answer that right now.');
      if (r.remaining === 0) $('#askForm').innerHTML = '<p class="small muted">You’ve used the free follow-ups. Request an advisor call above to go deeper.</p>';
    });
  }
  function restart() { E.track('wizard_restart', {}); state.step = 0; state.report = null; state.a = { regions: [] }; out.classList.add('hidden'); $('.hero-grid').classList.remove('hidden'); history.replaceState(null, '', location.pathname); renderStep(); document.getElementById('app').scrollIntoView({ behavior: 'smooth' }); }

  var rq = new URLSearchParams(location.search).get('r');
  if (rq) { location.replace('report.html?id=' + encodeURIComponent(rq)); return; }
  renderStep();
  document.querySelectorAll('[data-start]').forEach(function (b) { b.addEventListener('click', function () { setTimeout(function () { var o = wz.querySelector('.opt'); if (o) o.focus(); }, 400); }); });
  window.EMIQ = { rank: rank, cost: cost, state: state };
})();
