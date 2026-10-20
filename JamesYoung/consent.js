/* Cookie consent, shared by every page.
   Google Analytics only loads after the visitor clicks Accept. Declining later
   removes the Analytics cookies that were set. */
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
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { anonymize_ip: true });
    var s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }

  function removeAnalyticsCookies() {
    var host = location.hostname.replace(/^www\./, '');
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (!/^_ga/.test(name)) return;
      ['', host, '.' + host].forEach(function (d) {
        document.cookie = name + '=; Max-Age=0; path=/' + (d ? '; domain=' + d : '');
      });
    });
  }

  var consent = readConsent();
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
