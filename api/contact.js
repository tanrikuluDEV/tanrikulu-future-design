// Contact form → sends the brief to hello@tanrikulu.dev through the Namecheap Private Email mailbox (SMTP).
// Needs SMTP_PASS (the mailbox password) as a Vercel env var. SMTP_USER defaults to hello@tanrikulu.dev.
import nodemailer from 'nodemailer';

const TO = 'hello@tanrikulu.dev';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean = (v, max) => String(v ?? '').replace(/\r/g, '').trim().slice(0, max);
const oneLine = (v) => v.replace(/[\n\t]+/g, ' ');

let transport;
const getTransport = () => transport ??= nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.privateemail.com',
  port: Number(process.env.SMTP_PORT || 465),
  secure: true,
  auth: { user: process.env.SMTP_USER || TO, pass: process.env.SMTP_PASS },
});

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false, error: 'method' }); }
  if (!process.env.SMTP_PASS) return res.status(503).json({ ok: false, error: 'config' });

  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = null; } }
  if (!b || typeof b !== 'object') return res.status(400).json({ ok: false, error: 'body' });

  // Bots fill the hidden field; pretend it worked.
  if (clean(b.website, 200)) return res.status(200).json({ ok: true });

  const name = oneLine(clean(b.name, 120));
  const email = oneLine(clean(b.email, 200));
  const details = clean(b.details, 5000);
  const lang = b.lang === 'tr' ? 'tr' : 'en';
  if (!name || !EMAIL_RE.test(email) || !details) return res.status(400).json({ ok: false, error: 'fields' });

  const from = process.env.SMTP_USER || TO;
  try {
    await getTransport().sendMail({
      from: { name: 'tanrikulu.dev', address: from },
      to: TO,
      replyTo: { name, address: email },
      subject: `${lang === 'tr' ? 'Proje özeti' : 'Project brief'} — ${name}`,
      text: [`Name: ${name}`, `Email: ${email}`, `Page: ${lang === 'tr' ? 'tanrikulu.dev/tr' : 'tanrikulu.dev'}`, '', details].join('\n'),
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('contact: send failed', err?.code || '', err?.responseCode || '', err?.message || err);
    return res.status(502).json({ ok: false, error: 'send' });
  }
}
