/* EmergingMarketIQ shared report page — report.html?id=XXXX */
(function () {
  'use strict';
  var E = window.Engine, esc = E.esc, M = window.EM_MARKETS, byName = {};
  M.forEach(function (m) { byName[m.name] = m; });
  var usdK = function (n) { return n == null ? '—' : n >= 1e6 ? 'US$' + (n / 1e6).toFixed(1) + 'M' : 'US$' + Math.round(n / 1000) + 'k'; };
  var el = document.getElementById('report'), id = new URLSearchParams(location.search).get('id') || '';
  var OBJ = { sell: 'market-entry (sales)', delivery: 'offshore team', manufacture: 'manufacturing / supply chain', hq: 'regional HQ', invest: 'investment / acquisition' };
  function nf() { return '<h1>Report not found</h1><p class="muted">This link may be mistyped or expired.</p><a class="btn btn-primary" href="index.html#app">Run your own analysis</a>'; }
  if (!/^[A-Za-z0-9]{8}$/.test(id)) { el.innerHTML = nf(); return; }
  E.api({ id: id }, 'GET').then(function (r) {
    if (!r || r.error || r.product !== 'emiq') { el.innerHTML = nf(); E.track('report_not_found', { id: id }); return; }
    var a = r.inputs, n = r.narrative || {}, why = {}; (n.markets || []).forEach(function (x) { why[x.country] = x; });
    document.title = (n.headline || 'Emerging-market shortlist') + ' — EmergingMarketIQ';
    el.innerHTML = '<p class="eyebrow">Shared analysis · ' + esc(OBJ[a.objective] || a.objective) + ' · ' + esc(String(a.industry).replace('_', ' ')) + ' · ~' + esc(a.size) + ' people</p>' +
      '<h1 style="font-size:clamp(1.7rem,4.5vw,2.6rem)">' + esc(n.headline || 'Emerging-market shortlist') + '</h1><p class="muted">' + esc(n.summary || '') + '</p>' +
      '<div class="card no-print" style="margin:18px 0;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between"><div><b>Run this for your own company</b><div class="small muted">7 questions · free · no sign-up</div></div><a class="btn btn-primary" href="index.html?utm_source=report&utm_medium=cta#app" data-track="report_cta_own">Analyse my expansion</a></div>' +
      '<div class="rank">' + r.picks.map(function (p, i) {
        var m = byName[p.country] || {}, w = why[p.country] || {};
        return '<article class="pick"><div class="pick-top"><div><div class="small muted">#' + (i + 1) + ' · ' + esc(m.region || '') + '</div><h3>' + esc(m.flag || '') + ' ' + esc(p.country) + '</h3><div class="sub">' + esc(m.summary || '') + '</div></div><div class="fit" style="--v:' + p.score + '"><b>' + p.score + '</b><span>fit</span></div></div>' +
          '<ul class="facts"><li>First year ≈ <b>' + usdK(p.cost && p.cost.firstYear) + '</b></li><li>Run-rate ≈ <b>' + usdK(p.cost && p.cost.monthly) + '</b>/mo</li><li>Setup ≈ ' + usdK(p.cost && p.cost.setup) + '</li></ul>' +
          (w.why ? '<div class="aria"><div class="who">ARIA</div><p>' + esc(w.why) + '</p>' + (w.risk ? '<p class="check"><b>Main risk:</b> ' + esc(w.risk) + '</p>' : '') + (w.first_move ? '<p class="check"><b>First move:</b> ' + esc(w.first_move) + '</p>' : '') + '</div>' : '') +
          (m.slug ? '<p class="small" style="margin-top:8px"><a href="markets/' + esc(m.slug) + '.html">' + esc(p.country) + ' market brief →</a></p>' : '') + '</article>';
      }).join('') + '</div>' +
      (n.next_steps ? '<div class="card" style="margin-top:16px"><h3>Next steps</h3><ol class="steps">' + n.next_steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' + (n.cost_note ? '<p class="small muted" style="margin-top:12px">' + esc(n.cost_note) + '</p>' : '') + '</div>' : '') +
      '<div class="card no-print" style="margin-top:16px"><h3>Talk it through with an expansion advisor</h3><p class="muted small">Free 20-minute call. No obligation.</p><form class="call-form" data-lead="advisor_call" data-done="Thanks — request received. You\u2019ll get a confirmation email now and a calendar invite with a Google Meet link, usually within one business day."><div class="fgrid"><label>Your name<input name="name" required maxlength="120" autocomplete="name"></label><label>Work email<input type="email" name="email" required autocomplete="email"></label><label>Company<input name="company" maxlength="160" autocomplete="organization"></label><label>Best time for you<select name="preferred_times"><option value="">Any time</option><option>Morning (your time)</option><option>Afternoon (your time)</option><option>Evening (your time)</option></select></label></div><label>What would you like to discuss?<textarea name="message" rows="3" maxlength="1000"></textarea></label><button class="btn btn-primary btn-sm" type="submit">Request a call</button><p class="form-msg"></p></form></div>' +
      '<div class="card no-print" style="margin-top:16px"><div class="sharebar"><button class="btn btn-ghost btn-sm" data-share="linkedin">Share on LinkedIn</button><button class="btn btn-ghost btn-sm" data-share="copy">Copy link</button><button class="btn btn-ghost btn-sm" onclick="window.print()" data-track="print_click">Save as PDF</button></div></div>' +
      '<p class="notice">Generated ' + new Date(r.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) + '. Country data reviewed March 2026. Costs are indicative model estimates. Decision support only — not legal, tax or investment advice.</p>';
    el.querySelectorAll('[data-share]').forEach(function (b) { b.addEventListener('click', function () { E.share({ channel: b.dataset.share, id: id, url: E.reportUrl(id), title: n.headline || 'Emerging-market shortlist', text: 'Emerging-market shortlist from EmergingMarketIQ:' }); }); });
    E.bindLeadForms(el, { report_id: id, note: 'shared-report' });
    E.track('report_view', { report_id: id, from_share: /utm_source=share/.test(location.search), views: r.views });
  }).catch(function () { el.innerHTML = nf(); });
})();
