const nodemailer = require("nodemailer");

// Sends email using Nodemailer with Gmail (or service specified in EMAIL_SERVICE).
// EMAIL_PASS must be a 16-character Gmail App Password.
async function sendMail({ to, subject, text, html }) {
  const emailUser = String(process.env.EMAIL_USER || "").trim();
  const emailPass = String(process.env.EMAIL_PASS || "").replace(/\s+/g, "");

  if (!emailUser || !emailPass) {
    throw new Error("EMAIL_USER or EMAIL_PASS is missing in environment variables.");
  }

  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  return transporter.sendMail({
    from: `"CareSync" <${emailUser}>`,
    to: Array.isArray(to) ? to.join(", ") : to,
    subject,
    text: text || "",
    html: html || (text ? `<p>${text}</p>` : ""),
  });
}

module.exports = { sendMail };