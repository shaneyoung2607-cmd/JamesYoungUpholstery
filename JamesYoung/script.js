(function () {
  'use strict';

  var QUOTE_EMAIL = 'info@jamesinteriors.ie';
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
     Photos show in the order listed here.
     --------------------------------------------------------------- */
  var WORK = [
    { src: 'images/wingback-chair.jpg',         type: 'domestic',   title: 'Wingback armchair in willow-leaf weave', place: 'Reupholstered in our workshop', size: 'tall' },
    { src: 'images/function-room-chairs.jpg',   type: 'commercial', title: 'Function room chairs',            place: 'Event venue, Dublin' },
    { src: 'images/office-chairs.jpg',          type: 'commercial', title: 'Green leather office chairs',     place: 'Reupholstered in our workshop' },
    { src: 'images/hotel-lounge-banquette.jpg', type: 'commercial', title: 'Channel-tufted velvet banquette', place: 'Hotel lounge, Dublin', size: 'wide' },
    { src: 'images/showroom.jpg',               type: 'domestic',   title: 'Corner sofa, headboards and wall panels', place: 'Our showroom, North County Dublin', size: 'wide' },
    { src: 'images/banquette-bar.jpg',          type: 'commercial', title: 'Velvet banquette and cushions',   place: 'Hotel bar, Dublin' },
  ];

  /* Gallery + lightbox */
  var gallery = document.getElementById('gallery');
  var empty = document.getElementById('galleryEmpty');
  var tiles = WORK.map(function (w, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'tile reveal' + (w.size ? ' tile--' + w.size : ''); b.dataset.type = w.type; b.dataset.i = i;
    b.setAttribute('aria-label', 'View photo: ' + w.title);
    var img = document.createElement('img');
    img.src = w.src; img.alt = w.title + ', ' + w.place; img.loading = 'lazy';
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
    this.querySelectorAll('button').forEach(function (b) { b.classList.toggle('is-on', b === btn); });
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

  /* Quote wizard */
  var form = document.getElementById('wizard');
  var steps = form.querySelectorAll('.step');
  var bars = form.querySelectorAll('.wizard__bar li');
  var nextBtn = document.getElementById('next');
  var backBtn = document.getElementById('back');
  var err = document.getElementById('err');
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

  form.addEventListener('change', function (e) {
    var n = e.target.name;
    if (n === 'piece' || n === 'work' || n === 'fabric') sum(n, e.target.value);
    nextBtn.disabled = !canContinue();
    if (n === 'piece' && stepNo === 1) setTimeout(function () { if (canContinue()) go(2); }, 250);
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

  function validateContact() {
    var ok = true;
    ['name', 'phone'].forEach(function (n) {
      var el = form.elements[n], bad = !el.value.trim();
      el.classList.toggle('is-bad', bad); if (bad) ok = false;
    });
    var email = form.elements.email;
    var badEmail = email.value && !/^\S+@\S+\.\S+$/.test(email.value);
    email.classList.toggle('is-bad', !!badEmail); if (badEmail) ok = false;
    return ok;
  }

  function submit() {
    var e = form.elements;
    var lines = [
      'Piece: ' + val('piece'),
      'Work: ' + val('work'),
      'Quantity: ' + qty,
      'Fabric: ' + (val('fabric') || 'Not decided'),
      'Photos: ' + photos.length + ' (attached to this email)',
      '',
      'Name: ' + e.name.value.trim(),
      'Phone: ' + e.phone.value.trim(),
      'Email: ' + e.email.value.trim(),
      'Area: ' + e.area.value.trim(),
      '',
      'Notes: ' + e.notes.value.trim()
    ];
    var subject = 'Quote request: ' + val('piece') + ' (' + e.name.value.trim() + ')';
    window.location.href = 'mailto:' + QUOTE_EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
    go(5);
  }

  nextBtn.addEventListener('click', function () {
    if (!canContinue()) return;
    if (stepNo < 4) return go(stepNo + 1);
    if (!validateContact()) { err.textContent = 'Please add your name and phone number.'; return; }
    submit();
  });
  backBtn.addEventListener('click', function () { if (stepNo > 1) go(stepNo - 1); });
  form.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'radio') { e.preventDefault(); nextBtn.click(); }
  });

  document.getElementById('restart').addEventListener('click', function () {
    form.reset(); qty = 1; qtyOut.textContent = 1; photos = []; drawThumbs();
    ['piece', 'work', 'fabric'].forEach(function (k) { sum(k, ''); }); sum('qty', '1');
    go(1);
  });

  /* Links that pre-pick the piece, e.g. "Request a commercial quote" */
  document.querySelectorAll('[data-preset]').forEach(function (a) {
    a.addEventListener('click', function () {
      var r = form.querySelector('input[name="piece"][value="' + a.dataset.preset + '"]');
      if (r) { r.checked = true; sum('piece', r.value); stepNo = 2; render(); }
    });
  });

  render();
})();
