const nodemailer = require("nodemailer");
const { smtpFrom, smtpHost, smtpPass, smtpPort, smtpUser } = require("../config/env");

function getTransporter() {
  if (!smtpHost || !smtpUser || !smtpPass) {
    return null;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });
}

async function sendEmail({ to, subject, text }) {
  const transporter = getTransporter();
  if (!transporter) {
    return { skipped: true, reason: "SMTP not configured" };
  }

  await transporter.sendMail({
    from: smtpFrom,
    to,
    subject,
    text
  });

  return { skipped: false };
}

module.exports = { sendEmail };
