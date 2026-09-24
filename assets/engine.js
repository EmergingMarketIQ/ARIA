/* engine.js — shared runtime for the UniPath + EmergingMarketIQ web engines.
   No dependencies, no cookies. First-party analytics go to the product's own Supabase (insert-only table). */
(function () {
  'use strict';
  var CFG = window.ENGINE_CONFIG || {};
  var LS = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) {} }
  };
  var SS = {
    get: function (k) { try { return window.sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.sessionStorage.setItem(k, v); } catch (e) {} }
  };
  function rid(n) { var a = 'abcdefghijklmnopqrstuvwxyz0123456789', s = ''; var r = (window.crypto && crypto.getRandomValues) ? crypto.getRandomValues(new Uint8Array(n)) : null; for (var i = 0; i < n; i++) s += a[(r ? r[i] : Math.floor(Math.random() * 256)) % a.length]; return s; }

  // ---- identity (anonymous) ----
  var prefix = 'eng_' + (CFG.product || 'x') + '_';
  var anon = LS.get(prefix + 'anon'); var returning = !!anon;
  if (!anon) { anon = rid(16); LS.set(prefix + 'anon', anon); LS.set(prefix + 'first_seen', new Date().toISOString()); }
  var sess = SS.get(prefix + 'sess'); if (!sess) { sess = rid(12); SS.set(prefix + 'sess', sess); }
  var visits = parseInt(LS.get(prefix + 'visits') || '0', 10);
  if (!SS.get(prefix + 'counted')) { visits += 1; LS.set(prefix + 'visits', String(visits)); SS.set(prefix + 'counted', '1'); }

  // ---- attribution (first touch + last touch) ----
  var qs = new URLSearchParams(location.search);
  var utm = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'ref'].forEach(function (k) { var v = qs.get(k); if (v) utm[k] = v.slice(0, 80); });
  if (Object.keys(utm).length) { LS.set(prefix + 'utm_last', JSON.stringify(utm)); if (!LS.get(prefix + 'utm_first')) LS.set(prefix + 'utm_first', JSON.stringify(utm)); }
  var ref = document.referrer && document.referrer.indexOf(location.host) === -1 ? document.referrer.slice(0, 480) : '';
  if (ref && !LS.get(prefix + 'ref_first')) LS.set(prefix + 'ref_first', ref);
  function attribution() {
    var o = {}; try { o.first = JSON.parse(LS.get(prefix + 'utm_first') || 'null'); o.last = JSON.parse(LS.get(prefix + 'utm_last') || 'null'); } catch (e) {}
    o.ref_first = LS.get(prefix + 'ref_first'); return o;
  }
  function device() { var w = Math.min(window.innerWidth, screen.width || 9999); return /Mobi|Android|iPhone/i.test(navigator.userAgent) || w < 640 ? 'mobile' : (w < 1025 ? 'tablet' : 'desktop'); }

  // ---- analytics ----
  var queue = [], timer = null;
  function flush() {
    timer = null; if (!queue.length || !CFG.supabaseUrl) return;
    var batch = queue.splice(0, 25);
    var body = JSON.stringify(batch);
    try {
      fetch(CFG.supabaseUrl + '/rest/v1/web_events', {
        method: 'POST', keepalive: body.length < 60000,
        headers: { 'Content-Type': 'application/json', apikey: CFG.anonKey, Authorization: 'Bearer ' + CFG.anonKey, Prefer: 'return=minimal' },
        body: body
      }).catch(function () {});
    } catch (e) {}
  }
  function track(event, props) {
    var p = props || {};
    var row = {
      product: CFG.product, event: String(event).slice(0, 64), anon_id: anon, session_id: sess,
      path: (location.pathname + location.search).slice(0, 300), referrer: ref || null,
      utm: Object.keys(utm).length ? utm : null, device: device(),
      locale: (navigator.language || '').slice(0, 20), tz: (Intl.DateTimeFormat().resolvedOptions().timeZone || '').slice(0, 64),
      props: p
    };
    queue.push(row);
    if (CFG.debug) console.log('[track]', event, p);
    if (!timer) timer = setTimeout(flush, 800);
  }
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flush(); });

  // ---- API ----
  function api(body, method) {
    var url = CFG.supabaseUrl + '/functions/v1/aria-web' + (method === 'GET' ? '?id=' + encodeURIComponent(body.id) : '');
    return fetch(url, {
      method: method || 'POST',
      headers: { 'Content-Type': 'application/json', apikey: CFG.anonKey, Authorization: 'Bearer ' + CFG.anonKey },
      body: method === 'GET' ? undefined : JSON.stringify(body)
    }).then(function (r) { return r.json().then(function (j) { j._status = r.status; return j; }); });
  }

  function fn(name, body) {
    return fetch(CFG.supabaseUrl + '/functions/v1/' + name, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: CFG.anonKey, Authorization: 'Bearer ' + CFG.anonKey }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().then(function (j) { j._status = r.status; return j; }); });
  }

  // ---- sharing ----
  function reportUrl(id) {
    var base = CFG.siteUrl ? CFG.siteUrl.replace(/\/$/, '') + '/report.html' : new URL('report.html', location.href.replace(/[^/]*$/, '')).href;
    return base + '?id=' + encodeURIComponent(id) + '&utm_source=share&utm_medium=report';
  }
  function share(opts) {
    var url = opts.url, text = opts.text || '';
    track('share_click', { channel: opts.channel, report_id: opts.id || null });
    if (opts.channel === 'native' && navigator.share) { return navigator.share({ title: opts.title, text: text, url: url }).catch(function () {}); }
    if (opts.channel === 'whatsapp') { window.open('https://wa.me/?text=' + encodeURIComponent(text + ' ' + url), '_blank', 'noopener'); return; }
    if (opts.channel === 'linkedin') { window.open('https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url), '_blank', 'noopener'); return; }
    if (opts.channel === 'facebook') { window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url), '_blank', 'noopener'); return; }
    if (opts.channel === 'reddit') { window.open('https://www.reddit.com/submit?url=' + encodeURIComponent(url) + '&title=' + encodeURIComponent(opts.title || ''), '_blank', 'noopener'); return; }
    if (opts.channel === 'email') { location.href = 'mailto:?subject=' + encodeURIComponent(opts.title || '') + '&body=' + encodeURIComponent(text + '\n\n' + url); return; }
    // copy
    var done = function () { toast('Link copied'); };
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, function () { prompt('Copy this link', url); });
    else prompt('Copy this link', url);
  }

  // ---- UI helpers ----
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function toast(msg) {
    var t = document.getElementById('toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show'); setTimeout(function () { t.classList.remove('show'); }, 2200);
  }
  function money(n, cur) { if (n == null || isNaN(n)) return '—'; return (cur || 'A$') + Math.round(n).toLocaleString('en-AU'); }

  // Lead form binder: <form data-lead="intent"> with input[name=email], optional input[name=consent]
  function bindLeadForms(root, ctx) {
    (root || document).querySelectorAll('form[data-lead]').forEach(function (f) {
      if (f._bound) return; f._bound = true;
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var email = (f.querySelector('input[name=email]') || {}).value || '';
        var consent = !!(f.querySelector('input[name=consent]') || {}).checked;
        var btn = f.querySelector('button[type=submit]'); var msg = f.querySelector('.form-msg');
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email.trim())) { if (msg) msg.textContent = 'Please enter a valid email address.'; return; }
        if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = 'Saving…'; }
        var c = (typeof ctx === 'function' ? ctx() : ctx) || {};
        var val = function (n) { var el = f.querySelector('[name=' + n + ']'); return el ? el.value.trim() : null; };
        fn('web-leads', { email: email.trim(), intent: f.dataset.lead, consent: consent, report_id: c.report_id || null, anon_id: anon, utm: attribution(), price: f.dataset.price || null, note: c.note || null,
          name: val('name'), company: val('company'), message: val('message'), preferred_times: val('preferred_times'), tz: (Intl.DateTimeFormat().resolvedOptions().timeZone || '') })
          .then(function (r) {
            if (r && r.ok) {
              track('lead_submit', { intent: f.dataset.lead, report_id: c.report_id || null, price: f.dataset.price || null, consent: consent });
              f.innerHTML = '<p class="form-done">' + esc(f.dataset.done || 'Thanks — you’re on the list.') + '</p>';
            } else { if (msg) msg.textContent = 'Sorry, that didn’t work. Please try again.'; if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label; } }
          }).catch(function () { if (msg) msg.textContent = 'Connection problem — please try again.'; if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label; } });
      });
    });
  }

  // Auto-track clicks on [data-track]
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-track]');
    if (el) track(el.getAttribute('data-track'), { label: (el.getAttribute('data-label') || el.textContent || '').trim().slice(0, 60) });
  });

  window.Engine = { cfg: CFG, track: track, api: api, fn: fn, share: share, reportUrl: reportUrl, esc: esc, toast: toast, money: money, bindLeadForms: bindLeadForms, anon: anon, attribution: attribution, visits: function () { return visits; } };
  track('page_view', { returning: returning, visits: visits, title: document.title.slice(0, 80), first_touch: attribution().first || null });
})();
