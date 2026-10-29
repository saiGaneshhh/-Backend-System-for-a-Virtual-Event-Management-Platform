const nodemailer = require('nodemailer');
async function sendRegistrationEmail({ to, attendeeName, event }) {
  const configured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
  const subject = `Registration confirmed: ${event.title}`;
  const text = `Hi ${attendeeName},\n\nYour registration for "${event.title}" is confirmed.\nDate: ${event.date}\nTime: ${event.time}\n\nWe look forward to seeing you!\nVirtual Events Team`;
  if (!configured) {
    console.log('\n[DEMO EMAIL - not sent externally]\nTo:', to, '\nSubject:', subject, '\n' + text + '\n');
    return { delivered: false, mode: 'console-demo' };
  }
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
  await transporter.sendMail({ from: process.env.EMAIL_FROM || process.env.SMTP_USER, to, subject, text });
  return { delivered: true, mode: 'smtp' };
}
module.exports = { sendRegistrationEmail };
