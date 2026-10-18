const nodemailer = require("nodemailer");

// Sends email using Brevo HTTP API (Port 443 — works 100% on Render Free Tier)
// with automatic fallback to Nodemailer for local development.
async function sendMail({ to, subject, text, html }) {
  const brevoApiKey = (
    process.env.BREVO_API_KEY ||
    (process.env.BREVO_PASS && process.env.BREVO_PASS.trim().startsWith("xkeysib-") ? process.env.BREVO_PASS : "")
  ).trim();

  const senderEmail = (process.env.BREVO_USER || process.env.EMAIL_USER || "").trim();

  // 1. Brevo HTTP REST API (Port 443 HTTPS — NEVER blocked on Render Free Tier!)
  if (brevoApiKey && senderEmail) {
    const recipients = (Array.isArray(to) ? to : [to]).map((email) => ({
      email: typeof email === "string" ? email.trim() : email.email,
    }));

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": brevoApiKey,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "CareSync", email: senderEmail },
        to: recipients,
        subject,
        textContent: text || "",
        htmlContent: html || (text ? `<p>${text}</p>` : ""),
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("Brevo API error:", res.status, data);
      throw new Error(data.message || `Brevo API error (${res.status}): ${res.statusText}`);
    }

    console.log("Email sent successfully via Brevo API:", data.messageId);
    return { provider: "brevo-api", messageId: data.messageId };
  }

  // 2. Fallback to Nodemailer SMTP (for localhost or hosts where SMTP ports are open)
  const emailUser = String(process.env.EMAIL_USER || process.env.BREVO_USER || "").trim();
  const emailPass = String(process.env.EMAIL_PASS || process.env.BREVO_PASS || "").replace(/\s+/g, "");

  if (!emailUser || !emailPass) {
    throw new Error(
      "No email service configured. Please set BREVO_API_KEY and BREVO_USER in your Render environment variables."
    );
  }

  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
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