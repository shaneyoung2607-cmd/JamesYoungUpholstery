/* Cookie consent, shared by every page.
   Google Analytics (and its Google Ads link) only loads after the visitor clicks
   Accept, with Consent Mode v2 signals. Declining later removes the Analytics
   and Ads cookies that were set. */
(function () {
  'use strict';

  var GA_ID = 'G-V3T1QJDYNB'; // James's existing Google Analytics 4 property
  var CONSENT_KEY = 'jy-consent';
  var box = document.getElementById('cookie');

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  function readConsent() { try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; } }
  function saveConsent(v) { try { localStorage.setItem(CONSENT_KEY, v); } catch (e) {} }

  function loadAnalytics() {
    if (window.gtag) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    // Consent Mode v2 (basic): the tag only runs after Accept, so grant straight after the default
    window.gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' });
    window.gtag('consent', 'update', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' });
    window.gtag('set', 'url_passthrough', true);
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
    var s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }

  function removeAnalyticsCookies() {
    var host = location.hostname.replace(/^www\./, '');
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (!/^(_ga|_gcl)/.test(name)) return;
      ['', host, '.' + host].forEach(function (d) {
        document.cookie = name + '=; Max-Age=0; path=/' + (d ? '; domain=' + d : '');
      });
    });
  }

  /* Until the visitor accepts, carry the Google Ads click ID from page to page in
     the URL (nothing is stored or sent), so an ad visit still counts if they
     accept on a later page. */
  var AD_PARAMS = ['gclid', 'gbraid', 'wbraid'];
  function passClickIds() {
    var here = new URLSearchParams(location.search), carry = [];
    AD_PARAMS.forEach(function (p) { if (here.get(p)) carry.push([p, here.get(p)]); });
    if (!carry.length) return;
    document.addEventListener('click', function (e) {
      if (window.gtag) return;
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || a.origin !== location.origin) return;
      var url = new URL(a.href);
      carry.forEach(function (c) { if (!url.searchParams.has(c[0])) url.searchParams.set(c[0], c[1]); });
      a.href = url.href;
    });
  }

  var consent = readConsent();
  if (consent !== 'yes') passClickIds();
  if (consent === 'yes') loadAnalytics();
  else if (consent !== 'no') box.hidden = false;

  box.addEventListener('click', function (e) {
    var v = e.target.dataset && e.target.dataset.consent; if (!v) return;
    var had = readConsent() === 'yes';
    saveConsent(v); box.hidden = true;
    if (v === 'yes') loadAnalytics();
    else if (had) { removeAnalyticsCookies(); location.reload(); }
  });

  var settings = document.getElementById('cookieSettings');
  if (settings) settings.addEventListener('click', function () { box.hidden = false; });
})();
