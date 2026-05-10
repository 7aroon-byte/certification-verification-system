require('dotenv').config();
const nodemailer = require('nodemailer');

async function main() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const fromEmail = process.env.SMTP_FROM_EMAIL || user;

  if (!host || !user || !pass) {
    console.error('Missing SMTP settings. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS in server/.env');
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });

  try {
    console.log(`Testing SMTP connection to ${host}:${port} (secure=${secure}) ...`);
    await transporter.verify();
    console.log('SMTP verify OK');

    const recipient = process.argv[2] || user;
    const info = await transporter.sendMail({
      from: `"IHECVS SMTP Test" <${fromEmail}>`,
      to: recipient,
      subject: 'IHECVS SMTP Test Email',
      text: 'SMTP test successful. Your server can send email.',
    });

    console.log('Email sent successfully');
    console.log('To:', recipient);
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('SMTP test failed');
    console.error('Name:', error?.name || 'UnknownError');
    console.error('Code:', error?.code || 'N/A');
    console.error('Message:', error?.message || String(error));
    if (error?.response) {
      console.error('SMTP response:', error.response);
    }
    process.exit(1);
  }
}

main();
