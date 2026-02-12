const nodemailer = require('nodemailer');

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    console.warn('SMTP not fully configured; mail sending will fail.');
  }
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });
}

async function sendMail({ to, subject, text, html }) {
  const transporter = createTransport();
  const from = process.env.SMTP_FROM || 'no-reply@example.com';
  return transporter.sendMail({ from, to, subject, text, html });
}

module.exports = { sendMail };
