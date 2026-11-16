/* Shared by every page: header, mobile menu, scroll reveals and open/closed status. */
(function () {
  'use strict';

  /* Header state + floating CTA */
  var header = document.getElementById('header');
  var floatCta = document.querySelector('.float-cta');
  var quoteSec = document.getElementById('quote');
  function onScroll() {
    if (header) header.classList.toggle('is-stuck', window.scrollY > 40);
    if (!floatCta) return;
    var nearQuote = false;
    if (quoteSec) { var r = quoteSec.getBoundingClientRect(); nearQuote = r.top < window.innerHeight && r.bottom > 0; }
    floatCta.classList.toggle('is-hidden', window.scrollY < 600 || nearQuote);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* The top bar slides away on scroll. Its height changes when it wraps on phones,
     so measure it rather than hard-coding it in the CSS. */
  var topbar = document.querySelector('.topbar');
  function measureTopbar() { if (topbar) header.style.setProperty('--topbar-h', topbar.offsetHeight + 'px'); }
  if (header && topbar) { measureTopbar(); window.addEventListener('resize', measureTopbar); }

  /* Mobile menu: Escape closes it, the page behind doesn't scroll, and Tab stays inside it */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');
  if (burger && nav) {
    var setNav = function (open) {
      nav.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', open);
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.documentElement.classList.toggle('nav-open', open);
    };
    var navOpen = function () { return nav.classList.contains('is-open'); };
    burger.addEventListener('click', function () { setNav(!navOpen()); });
    nav.addEventListener('click', function (e) { if (e.target.tagName === 'A') setNav(false); });
    document.addEventListener('keydown', function (e) {
      if (!navOpen()) return;
      if (e.key === 'Escape') { setNav(false); burger.focus(); return; }
      if (e.key !== 'Tab') return;
      var links = nav.querySelectorAll('a');
      var first = burger, last = links[links.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    /* Close it if the window grows to the desktop layout */
    if (window.matchMedia) {
      var wide = window.matchMedia('(min-width: 1101px)');
      var onWide = function () { if (wide.matches && navOpen()) setNav(false); };
      if (wide.addEventListener) wide.addEventListener('change', onWide); else if (wide.addListener) wide.addListener(onWide);
    }
  }

  /* Quote links on other pages can pre-pick the piece (e.g. "Commercial seating");
     script.js reads this when the home page opens at the quote form. */
  if (!document.getElementById('wizard')) {
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[data-preset]');
      if (a) { try { sessionStorage.setItem('jy-preset', a.dataset.preset); } catch (err) {} }
    });
  }

  /* Reveal on scroll */
  function observeReveals(els) {
    if (!('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }
  observeReveals(document.querySelectorAll('.reveal'));

  /* Conversion tracking: only sends if the visitor accepted Analytics (gtag exists).
     These events can be imported into Google Ads as conversions. */
  function track(name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="tel:"], a[href^="mailto:"]');
    if (!a) return;
    var href = a.getAttribute('href');
    track(href.indexOf('tel:') === 0 ? 'phone_call_click' : 'email_click', {
      link_url: href, page_path: location.pathname
    });
  });

  window.JY = { observeReveals: observeReveals, track: track };

  /* Open / closed status (Irish time) */
  var openDot = document.getElementById('openDot');
  var openText = document.getElementById('openText');
  if (!openDot || !openText) return;
  var HOURS = { 0: null, 1: [510, 1020], 2: [510, 1020], 3: [510, 1020], 4: [510, 1020], 5: [510, 930], 6: [510, 750] };
  function dublinNow() {
    try {
      var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Dublin', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
      var o = {}; parts.forEach(function (p) { o[p.type] = p.value; });
      var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      return { day: days[o.weekday], mins: (parseInt(o.hour, 10) % 24) * 60 + parseInt(o.minute, 10) };
    } catch (e) { var d = new Date(); return { day: d.getDay(), mins: d.getHours() * 60 + d.getMinutes() }; }
  }
  function fmt(m) { var h = Math.floor(m / 60), mm = m % 60; return (h > 12 ? h - 12 : h) + (mm ? ':' + String(mm).padStart(2, '0') : '') + (h >= 12 ? 'pm' : 'am'); }
  var now = dublinNow();
  var today = HOURS[now.day];
  var isOpen = today && now.mins >= today[0] && now.mins < today[1];
  openDot.classList.toggle('is-open', !!isOpen);
  openText.textContent = isOpen
    ? 'Workshop open until ' + fmt(today[1])
    : 'Closed now · send photos any time for a quote';
  var row = document.querySelector('#hours tr[data-day="' + now.day + '"]');
  if (row) row.classList.add('is-today');
})();
