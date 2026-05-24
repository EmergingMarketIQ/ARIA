/* =========================================================
   EmergingMarketIQ — Landing Page Scripts
   - Sticky nav state on scroll
   - Mobile nav toggle
   - Smooth scroll for in-page anchors
   - Reveal-on-scroll using IntersectionObserver
   - Email capture (client-side, GitHub-Pages friendly)
   - Current year in footer
   ========================================================= */

(function () {
  'use strict';

  // -----------------------------
  // Footer year
  // -----------------------------
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // -----------------------------
  // Navbar scroll state
  // -----------------------------
  var navbar = document.getElementById('navbar');
  var onScroll = function () {
    if (!navbar) return;
    if (window.scrollY > 8) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // -----------------------------
  // Mobile nav toggle
  // -----------------------------
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    // Close menu after clicking a link (mobile)
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        if (links.classList.contains('open')) {
          links.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  // -----------------------------
  // Smooth scroll fallback (in case browser ignores CSS smooth-behavior)
  // -----------------------------
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var href = link.getAttribute('href');
      if (!href || href === '#' || href.length < 2) return;
      var target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.pageYOffset - 60;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });

  // -----------------------------
  // Reveal on scroll
  // -----------------------------
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    // No IntersectionObserver support — just show everything
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  // -----------------------------
  // Email capture (client-side only — stores locally and shows confirmation)
  // Replace the inside of submitEmail() with your real endpoint
  // (Mailchimp, ConvertKit, Buttondown, Formspree, Google Forms, etc.)
  // -----------------------------
  var form = document.getElementById('emailForm');
  var note = document.getElementById('emailNote');

  function setNote(msg, type) {
    if (!note) return;
    note.textContent = msg;
    note.classList.remove('success', 'error');
    if (type) note.classList.add(type);
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
  }

  function submitEmail(email) {
    // Persist locally so visitors don't lose their entry if your endpoint
    // isn't wired up yet. Replace this with a real fetch() to your form
    // service once you have one.
    try {
      var key = 'eiq_emails';
      var existing = JSON.parse(localStorage.getItem(key) || '[]');
      if (existing.indexOf(email) === -1) existing.push(email);
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (e) { /* localStorage may be blocked — that's fine */ }

    /*
      Example: replace with your real endpoint
      return fetch('https://formspree.io/f/your-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email: email })
      });
    */
    return Promise.resolve();
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = form.querySelector('input[type="email"]');
      if (!input) return;
      var email = input.value.trim();

      if (!isValidEmail(email)) {
        setNote('Please enter a valid email address.', 'error');
        input.focus();
        return;
      }

      setNote('Submitting…');
      submitEmail(email).then(function () {
        setNote('Thanks! You’re on the list. We’ll be in touch with early updates.', 'success');
        form.reset();
      }).catch(function () {
        setNote('Something went wrong. Please try again or email supportmarketiq@gmail.com.', 'error');
      });
    });
  }

  // -----------------------------
  // Google Play button (placeholder hook)
  // The href is "#" until you paste in your real Google Play URL — see README.
  // -----------------------------
  // No JS action needed: just update the <a href="..."> in index.html.

})();
