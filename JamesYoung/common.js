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

  /* Mobile menu */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');
  if (burger && nav) {
    var closeNav = function () { nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', false); };
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open);
    });
    nav.addEventListener('click', function (e) { if (e.target.tagName === 'A') closeNav(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });
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
  window.JY = { observeReveals: observeReveals };

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
