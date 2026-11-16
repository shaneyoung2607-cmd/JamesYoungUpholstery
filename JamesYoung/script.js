(function () {
  'use strict';

  var QUOTE_EMAIL = 'info@jamesinteriors.ie';
  var QUOTE_API = '/api/quote'; // api/quote.js emails the request to the workshop
  /* Cookie consent and Google Analytics live in consent.js (shared with privacy.html) */

  /* Google Map only loads when the visitor asks for it */
  document.getElementById('mapLoad').addEventListener('click', function () {
    var map = document.getElementById('map');
    var f = document.createElement('iframe');
    f.title = 'Map to the James Young Upholstery workshop';
    f.referrerPolicy = 'no-referrer-when-downgrade';
    f.src = map.dataset.src;
    map.innerHTML = ''; map.appendChild(f);
  });

  /* ---------------------------------------------------------------
     OUR WORK GALLERY
     To add a photo: put the file in the images folder, then add a
     line below. type is one of: commercial, domestic, restoration.
     size is optional: 'tall' (two rows high, suits upright photos)
     or 'wide' (two columns wide, suits landscape photos).
     thumb is optional: a smaller copy shown in the grid, while the
     full src opens in the lightbox.
     Photos show in the order listed here.
     --------------------------------------------------------------- */
  var WORK = [
    { src: 'images/wingback-chair.webp',         thumb: 'images/wingback-chair-800.webp',         type: 'domestic',   title: 'Wingback armchair in willow-leaf weave', place: 'Reupholstered in our workshop', size: 'tall' },
    { src: 'images/function-room-chairs.webp',                                                     type: 'commercial', title: 'Function room chairs',            place: 'Event venue, Dublin' },
    { src: 'images/office-chairs.webp',                                                            type: 'commercial', title: 'Green leather office chairs',     place: 'Reupholstered in our workshop' },
    { src: 'images/hotel-lounge-banquette.webp', thumb: 'images/hotel-lounge-banquette-800.webp', type: 'commercial', title: 'Channel-tufted velvet banquette', place: 'Hotel lounge, Dublin', size: 'wide' },
    { src: 'images/showroom.webp',               thumb: 'images/showroom-800.webp',               type: 'domestic',   title: 'Corner sofa, headboards and wall panels', place: 'Our showroom, North County Dublin', size: 'wide' },
    { src: 'images/banquette-bar.webp',                                                            type: 'commercial', title: 'Velvet banquette and cushions',   place: 'Hotel bar, Dublin' },
  ];

  /* Gallery + lightbox */
  var gallery = document.getElementById('gallery');
  var empty = document.getElementById('galleryEmpty');
  var tiles = WORK.map(function (w, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'tile reveal' + (w.size ? ' tile--' + w.size : ''); b.dataset.type = w.type; b.dataset.i = i;
    b.setAttribute('aria-label', 'View photo: ' + w.title);
    var img = document.createElement('img');
    img.src = w.thumb || w.src; img.alt = w.title + ', ' + w.place; img.loading = 'lazy';
    var cap = document.createElement('span');
    cap.className = 'tile__cap';
    cap.innerHTML = '<small></small>';
    cap.firstChild.textContent = w.type;
    cap.appendChild(document.createTextNode(w.title));
    b.appendChild(img); b.appendChild(cap); gallery.appendChild(b);
    return b;
  });
  window.JY.observeReveals(tiles);

  var visible = WORK.map(function (_, i) { return i; });
  document.getElementById('filters').addEventListener('click', function (e) {
    var btn = e.target.closest('button'); if (!btn) return;
    this.querySelectorAll('button').forEach(function (b) { b.classList.toggle('is-on', b === btn); b.setAttribute('aria-pressed', b === btn); });
    var f = btn.dataset.filter;
    visible = [];
    tiles.forEach(function (t, i) {
      var show = f === 'all' || t.dataset.type === f;
      t.classList.toggle('is-hidden', !show);
      if (show) { visible.push(i); t.classList.add('is-in'); }
    });
    empty.hidden = visible.length > 0;
  });

  var lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lbImg');
  var lbCap = document.getElementById('lbCap');
  var cur = 0;
  function show(i) {
    cur = i; var w = WORK[i];
    lbImg.src = w.src; lbImg.alt = w.title + ', ' + w.place;
    lbCap.textContent = w.title + ' · ' + w.place;
  }
  function step(d) { var p = visible.indexOf(cur); show(visible[(p + d + visible.length) % visible.length]); }
  gallery.addEventListener('click', function (e) {
    var t = e.target.closest('.tile'); if (!t) return;
    show(+t.dataset.i);
    if (lb.showModal) lb.showModal(); else lb.setAttribute('open', '');
  });
  document.getElementById('lbClose').onclick = function () { lb.close(); };
  document.getElementById('lbPrev').onclick = function () { step(-1); };
  document.getElementById('lbNext').onclick = function () { step(1); };
  lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
  lb.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') step(-1); if (e.key === 'ArrowRight') step(1); });
  /* Swipe left / right between photos on touch screens */
  var swipeX = null, swipeY = null;
  lb.addEventListener('touchstart', function (e) { swipeX = e.changedTouches[0].clientX; swipeY = e.changedTouches[0].clientY; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (swipeX === null) return;
    var dx = e.changedTouches[0].clientX - swipeX, dy = e.changedTouches[0].clientY - swipeY;
    swipeX = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
  }, { passive: true });

  /* Quote wizard */
  var form = document.getElementById('wizard');
  var steps = form.querySelectorAll('.step');
  var bars = form.querySelectorAll('.wizard__bar li');
  var nextBtn = document.getElementById('next');
  var backBtn = document.getElementById('back');
  var err = document.getElementById('err');
  var stepNote = document.getElementById('stepNote');
  var qtyOut = document.getElementById('qty');
  var photoInput = document.getElementById('photos');
  var drop = document.getElementById('drop');
  var thumbs = document.getElementById('thumbs');
  var stepNo = 1, qty = 1, photos = [];

  function val(name) { var el = form.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : ''; }
  function sum(key, v) { document.querySelector('[data-sum="' + key + '"]').textContent = v || '–'; }
  function canContinue() {
    if (stepNo === 1) return !!val('piece');
    if (stepNo === 2) return !!val('work');
    return true;
  }
  function render() {
    steps.forEach(function (s) { s.classList.toggle('is-active', +s.dataset.step === stepNo); });
    bars.forEach(function (b, i) { b.classList.toggle('on', i < stepNo); });
    if (stepNo <= 4) stepNote.textContent = 'Step ' + stepNo + ' of 4';
    backBtn.hidden = stepNo === 1 || stepNo === 5;
    nextBtn.textContent = stepNo === 4 ? 'Send request' : 'Continue';
    nextBtn.disabled = !canContinue();
    form.classList.toggle('is-done', stepNo === 5);
    err.textContent = '';
  }
  function go(n) {
    stepNo = n; render();
    var top = form.getBoundingClientRect().top + window.scrollY - 110;
    if (window.scrollY > top) window.scrollTo({ top: top, behavior: 'smooth' });
    var t = form.querySelector('.step.is-active legend, .step.is-active h3');
    if (t) { t.tabIndex = -1; t.focus({ preventScroll: true }); }
  }

  /* Step 1 moves on by itself after a tap or click. Not for the keyboard: arrow keys
     select each option as they pass it, so moving on would stop people choosing. */
  var byPointer = false;
  form.addEventListener('pointerdown', function () { byPointer = true; });
  form.addEventListener('keydown', function () { byPointer = false; });

  form.addEventListener('change', function (e) {
    var n = e.target.name;
    if (n === 'piece' || n === 'work' || n === 'fabric') sum(n, e.target.value);
    nextBtn.disabled = !canContinue();
    if (n === 'piece' && stepNo === 1 && byPointer) setTimeout(function () { if (stepNo === 1 && canContinue()) go(2); }, 250);
  });
  form.addEventListener('input', function (e) {
    if (e.target.classList.contains('is-bad')) { e.target.classList.remove('is-bad'); e.target.removeAttribute('aria-invalid'); err.textContent = ''; }
  });

  form.querySelectorAll('[data-qty]').forEach(function (b) {
    b.addEventListener('click', function () {
      qty = Math.max(1, Math.min(200, qty + (+b.dataset.qty)));
      qtyOut.textContent = qty; sum('qty', String(qty));
    });
  });

  function addFiles(list) {
    Array.prototype.forEach.call(list, function (f) {
      if (/^image\//.test(f.type) && photos.length < 10) photos.push(f);
    });
    drawThumbs();
  }
  function drawThumbs() {
    thumbs.innerHTML = '';
    photos.forEach(function (f, i) {
      var fig = document.createElement('figure');
      var img = document.createElement('img');
      img.alt = 'Photo ' + (i + 1); img.src = URL.createObjectURL(f);
      img.onload = function () { URL.revokeObjectURL(img.src); };
      var x = document.createElement('button');
      x.type = 'button'; x.setAttribute('aria-label', 'Remove photo ' + (i + 1)); x.textContent = '✕';
      x.onclick = function () { photos.splice(i, 1); drawThumbs(); };
      fig.appendChild(img); fig.appendChild(x); thumbs.appendChild(fig);
    });
    sum('photos', photos.length + ' added');
  }
  photoInput.addEventListener('change', function () { addFiles(photoInput.files); photoInput.value = ''; });
  ['dragenter', 'dragover'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('is-over'); }); });
  ['dragleave', 'drop'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove('is-over'); }); });
  drop.addEventListener('drop', function (e) { addFiles(e.dataTransfer.files); });

  /* Returns '' when the contact details are fine, or a message saying what to fix.
     The first field that needs attention gets the focus. */
  function validateContact() {
    var e = form.elements, msgs = [], firstBad = null;
    function mark(el, bad, msg) {
      el.classList.toggle('is-bad', bad);
      if (bad) { el.setAttribute('aria-invalid', 'true'); msgs.push(msg); firstBad = firstBad || el; }
      else el.removeAttribute('aria-invalid');
    }
    mark(e.name, !e.name.value.trim(), 'your name');
    var digits = e.phone.value.replace(/\D/g, '');
    mark(e.phone, digits.length < 7, e.phone.value.trim() ? 'a full phone number' : 'your phone number');
    var mail = e.email.value.trim();
    mark(e.email, !!mail && !/^\S+@\S+\.\S+$/.test(mail), 'a valid email address (or leave it blank)');
    if (firstBad) firstBad.focus();
    return msgs.length ? 'Please add ' + msgs.join(' and ') + '.' : '';
  }

  /* The request as text: used for the email, the "Copy my details" button and photo sharing */
  function requestText() {
    var e = form.elements;
    return {
      subject: 'Quote request: ' + val('piece') + ' (' + e.name.value.trim() + ')',
      body: [
        'Piece: ' + val('piece'),
        'Work: ' + val('work'),
        'Quantity: ' + qty,
        'Fabric: ' + (val('fabric') || 'Not decided'),
        'Photos: ' + photos.length + (photos.length ? ' (I will attach or send them)' : ''),
        '',
        'Name: ' + e.name.value.trim(),
        'Phone: ' + e.phone.value.trim(),
        'Email: ' + e.email.value.trim(),
        'Area: ' + e.area.value.trim(),
        '',
        'Notes: ' + e.notes.value.trim()
      ].join('\n')
    };
  }

  var shareBtn = document.getElementById('sharePhotos');
  var copyBtn = document.getElementById('copyDetails');
  var doneStatus = document.getElementById('doneStatus');
  function canSharePhotos() {
    try { return photos.length > 0 && !!navigator.canShare && navigator.canShare({ files: photos }); } catch (e) { return false; }
  }

  var doneTitle = document.getElementById('doneTitle');
  var doneSent = document.getElementById('doneSent');
  var doneEmail = document.getElementById('doneEmail');
  var openEmail = document.getElementById('openEmail');
  var sending = false;

  function lead(method) {
    if (window.JY && window.JY.track) window.JY.track('generate_lead', { form: 'quote', piece: val('piece'), photos: photos.length, method: method });
  }

  /* Shrinks a photo in the browser. Resolves to base64 JPEG data, or '' if the file can't be read. */
  function shrink(file, maxSide, quality) {
    return new Promise(function (resolve) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var data = '';
        try {
          var k = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
          var c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(img.naturalWidth * k)); c.height = Math.max(1, Math.round(img.naturalHeight * k));
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          data = c.toDataURL('image/jpeg', quality).split(',')[1] || '';
        } catch (e) {}
        URL.revokeObjectURL(url); resolve(data);
      };
      img.onerror = function () { URL.revokeObjectURL(url); resolve(''); };
      img.src = url;
    });
  }
  /* Phone photos are several megabytes each and one request can carry about 4.5 MB,
     so each photo gets an equal share and is made smaller until it fits. */
  function packPhotos() {
    var out = [], allow = Math.floor(3300000 / Math.max(1, photos.length));
    var sizes = [[1600, 0.8], [1200, 0.7], [900, 0.6]];
    return photos.reduce(function (chain, file) {
      return chain.then(function () {
        return sizes.reduce(function (p, s) {
          return p.then(function (got) {
            return got || shrink(file, s[0], s[1]).then(function (d) { return d && d.length <= allow ? d : ''; });
          });
        }, Promise.resolve('')).then(function (d) { if (d) out.push(d); });
      });
    }, Promise.resolve()).then(function () { return out; });
  }

  /* Sends the request to the workshop's inbox through the website (api/quote.js).
     Resolves to the number of photos that went with it. */
  function sendOnline() {
    var e = form.elements;
    return packPhotos().then(function (packed) {
      var ctrl = window.AbortController ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 45000);
      return fetch(QUOTE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl ? ctrl.signal : undefined,
        body: JSON.stringify({
          piece: val('piece'), work: val('work'), qty: qty, fabric: val('fabric'),
          name: e.name.value.trim(), phone: e.phone.value.trim(), email: e.email.value.trim(),
          area: e.area.value.trim(), notes: e.notes.value.trim(),
          website: e.website ? e.website.value : '',
          photos: packed
        })
      }).then(function (r) {
        clearTimeout(timer);
        if (!r.ok) throw new Error('not sent');
        return r.json();
      }).then(function (j) {
        if (!j || !j.ok) throw new Error('not sent');
        return packed.length;
      });
    });
  }

  /* The success screen has two versions: sent for you, or finish it in your own email app */
  function showDone(sentCount) {
    var online = sentCount !== null;
    doneSent.hidden = !online; doneEmail.hidden = online;
    doneStatus.textContent = '';
    if (online) {
      doneTitle.textContent = 'Thanks, your request has been sent';
      var msg = 'We have your details';
      if (photos.length && sentCount === photos.length) msg += ' and ' + sentCount + (sentCount === 1 ? ' photo' : ' photos');
      msg += '. We\'ll come back to you with a price and fabric suggestions.';
      if (sentCount < photos.length) msg += ' ' + (photos.length - sentCount) + ' of your photos couldn\'t be sent: please text them to 087 204 7560.';
      doneSent.textContent = msg;
    } else {
      doneTitle.textContent = 'Thanks, your request is ready';
      /* An email link can't carry attachments. Where the phone can share files, offer its share sheet for the photos. */
      shareBtn.hidden = !canSharePhotos();
    }
    go(5);
  }

  /* The fallback, and how the form always worked before: open the visitor's own email app */
  function submitByEmail() {
    var t = requestText();
    var link = 'mailto:' + QUOTE_EMAIL + '?subject=' + encodeURIComponent(t.subject) + '&body=' + encodeURIComponent(t.body);
    lead('email');
    openEmail.href = link;
    window.location.href = link;
    showDone(null);
  }

  function submit() {
    if (sending) return;
    if (!window.fetch || !window.Promise) return submitByEmail();
    sending = true;
    nextBtn.disabled = true; backBtn.disabled = true; nextBtn.textContent = 'Sending…'; err.textContent = '';
    var finish = function () { sending = false; backBtn.disabled = false; };
    sendOnline().then(
      function (sentCount) { finish(); lead('form'); showDone(sentCount); },
      function () { finish(); submitByEmail(); }
    );
  }

  /* Opens the phone's share sheet with the chosen photos, so they can go by email, WhatsApp or text */
  shareBtn.addEventListener('click', function () {
    var t = requestText();
    navigator.share({ files: photos, title: t.subject, text: t.subject + '\nSend to ' + QUOTE_EMAIL + ' or 087 204 7560\n\n' + t.body })
      .then(function () { doneStatus.textContent = 'Thanks. Send them to ' + QUOTE_EMAIL + ' or 087 204 7560 in the app you chose.'; })
      .catch(function (e) { if (!e || e.name !== 'AbortError') doneStatus.textContent = 'Sharing didn\'t work on this device. Please attach the photos to your email instead.'; });
  });

  /* For visitors whose email app didn't open: copy the request so it can be pasted anywhere */
  copyBtn.addEventListener('click', function () {
    var t = requestText(), text = 'To: ' + QUOTE_EMAIL + '\n' + t.subject + '\n\n' + t.body;
    function ok() { doneStatus.textContent = 'Copied. Paste it into an email or message to ' + QUOTE_EMAIL + '.'; }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta); ta.select();
      var done = false; try { done = document.execCommand('copy'); } catch (e) {}
      ta.remove();
      doneStatus.textContent = done ? '' : 'Couldn\'t copy on this device. Please call 087 204 7560.';
      if (done) ok();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, fallback); else fallback();
  });

  nextBtn.addEventListener('click', function () {
    if (!canContinue()) return;
    if (stepNo < 4) return go(stepNo + 1);
    var problem = validateContact();
    if (problem) { err.textContent = problem; return; }
    submit();
  });
  backBtn.addEventListener('click', function () { if (stepNo > 1) go(stepNo - 1); });
  form.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'radio') { e.preventDefault(); nextBtn.click(); }
  });

  document.getElementById('restart').addEventListener('click', function () {
    form.reset(); qty = 1; qtyOut.textContent = 1; photos = []; drawThumbs();
    form.querySelectorAll('.is-bad').forEach(function (el) { el.classList.remove('is-bad'); el.removeAttribute('aria-invalid'); });
    ['piece', 'work', 'fabric'].forEach(function (k) { sum(k, ''); }); sum('qty', '1');
    go(1);
  });

  /* Links that pre-pick the piece, e.g. "Request a commercial quote" */
  function preset(value) {
    var r = form.querySelector('input[name="piece"][value="' + value + '"]');
    if (r) { r.checked = true; sum('piece', r.value); stepNo = 2; }
  }
  document.querySelectorAll('[data-preset]').forEach(function (a) {
    a.addEventListener('click', function () { preset(a.dataset.preset); render(); });
  });
  /* The same, for quote links clicked on the service pages (stored by common.js) */
  try {
    var stored = sessionStorage.getItem('jy-preset');
    if (stored) { sessionStorage.removeItem('jy-preset'); if (location.hash === '#quote') preset(stored); }
  } catch (e) {}

  render();
})();
