/* Receives the quote form from the website and emails it to the workshop through Resend.

   Runs as a Vercel function at /api/quote. Nothing is stored here: the request is
   turned into one email (photos attached) and passed on.

   Set these in Vercel > Project > Settings > Environment Variables:
     RESEND_API_KEY  (required)  the API key from resend.com
     QUOTE_TO        (optional)  where requests go. Default: info@jamesinteriors.ie
     QUOTE_FROM      (optional)  the sender. Must be on a domain verified in Resend.
                                 Default: James Young Upholstery website <quotes@jamesinteriors.ie>

   Until RESEND_API_KEY is set this answers 503 and the website falls back to opening
   the visitor's own email app, exactly as it did before. */

const TO = process.env.QUOTE_TO || 'info@jamesinteriors.ie';
const FROM = process.env.QUOTE_FROM || 'James Young Upholstery website <quotes@jamesinteriors.ie>';
const MAX_PHOTOS = 10;
const MAX_PHOTO_CHARS = 3400000; // base64 characters across all photos (the host caps a request at about 4.5 MB)

/* One line of plain text, trimmed and capped, with no line breaks (keeps email headers safe) */
function line(value, max) {
  return String(value == null ? '' : value).replace(/[\r\n\t]+/g, ' ').trim().slice(0, max);
}
function block(value, max) {
  return String(value == null ? '' : value).replace(/\r/g, '').trim().slice(0, max);
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  /* Only accept the form from this website itself */
  const origin = req.headers.origin;
  if (origin) {
    let originHost = '';
    try { originHost = new URL(origin).host; } catch (e) {}
    if (originHost !== req.headers.host) return res.status(403).json({ ok: false, error: 'forbidden' });
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) return res.status(503).json({ ok: false, error: 'not_configured' });

  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
  if (!b || typeof b !== 'object') return res.status(400).json({ ok: false, error: 'bad_request' });

  /* Hidden field that people never see or fill. Bots do, so quietly drop those. */
  if (line(b.website, 200)) return res.status(200).json({ ok: true });

  const name = line(b.name, 120);
  const phone = line(b.phone, 40);
  const email = line(b.email, 200);
  if (!name || phone.replace(/\D/g, '').length < 7) return res.status(400).json({ ok: false, error: 'missing_details' });
  const emailOk = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(email);

  const piece = line(b.piece, 80);
  const photos = [];
  let total = 0;
  (Array.isArray(b.photos) ? b.photos : []).slice(0, MAX_PHOTOS).forEach(function (data) {
    if (typeof data !== 'string' || !/^[A-Za-z0-9+/]+=*$/.test(data)) return;
    if (total + data.length > MAX_PHOTO_CHARS) return;
    total += data.length;
    photos.push({ filename: 'photo-' + (photos.length + 1) + '.jpg', content: data });
  });

  const work = line(b.work, 80), qty = line(b.qty, 6), fabric = line(b.fabric, 80), area = line(b.area, 120), notes = block(b.notes, 4000);
  const lines = ['New quote request from the website', '', 'Piece: ' + (piece || 'Not given')];
  if (work) lines.push('Work: ' + work);
  if (qty) lines.push('Quantity: ' + qty);
  if (fabric) lines.push('Fabric: ' + fabric);
  lines.push('Photos: ' + photos.length + (photos.length ? ' attached' : ''), '', 'Name: ' + name, 'Phone: ' + phone);
  if (email) lines.push('Email: ' + email);
  if (area) lines.push('Area: ' + area);
  if (notes) lines.push('', 'What needs doing: ' + notes);
  const text = lines.join('\n');

  const message = {
    from: FROM,
    to: [TO],
    subject: 'Quote request: ' + (piece || 'Website') + ' (' + name + ')',
    text: text
  };
  if (emailOk) message.reply_to = email; // so James can simply press Reply
  if (photos.length) message.attachments = photos;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
    if (!r.ok) {
      /* Log the reason for the site owner, never the visitor's details */
      console.error('Resend refused the email:', r.status, (await r.text()).slice(0, 300));
      return res.status(502).json({ ok: false, error: 'send_failed' });
    }
    return res.status(200).json({ ok: true, photos: photos.length });
  } catch (e) {
    console.error('Could not reach Resend:', e && e.message);
    return res.status(502).json({ ok: false, error: 'send_failed' });
  }
};
