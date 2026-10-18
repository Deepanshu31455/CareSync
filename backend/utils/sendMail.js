const nodemailer = require("nodemailer");

// Sends email using Nodemailer.
// Supports Brevo SMTP (Port 587 — never blocked on Render) and Gmail SMTP fallback.
async function sendMail({ to, subject, text, html }) {
  const brevoUser = process.env.BREVO_USER?.trim();
  const brevoPass = process.env.BREVO_PASS?.trim();

  let transporter;
  let fromAddress;

  // 1. Primary for Cloud / Render: Brevo SMTP (Port 587 — unblocked on Render)
  if (brevoUser && brevoPass) {
    transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false, // port 587 uses STARTTLS
      auth: {
        user: brevoUser,
        pass: brevoPass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
    fromAddress = `"CareSync" <${process.env.EMAIL_USER || brevoUser}>`;
  } else {
    // 2. Fallback to Gmail SMTP (for localhost or hosts where SMTP ports are open)
    const emailUser = String(process.env.EMAIL_USER || "").trim();
    const emailPass = String(process.env.EMAIL_PASS || "").replace(/\s+/g, "");

    if (!emailUser || !emailPass) {
      throw new Error("No email service configured. Please set BREVO_USER and BREVO_PASS (or EMAIL_USER and EMAIL_PASS).");
    }

    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
    fromAddress = `"CareSync" <${emailUser}>`;
  }

  return transporter.sendMail({
    from: fromAddress,
    to: Array.isArray(to) ? to.join(", ") : to,
    subject,
    text: text || "",
    html: html || (text ? `<p>${text}</p>` : ""),
  });
}

module.exports = { sendMail };