const nodemailer = require("nodemailer");
 
// Sends one email, using the same EMAIL_USER / EMAIL_PASS as the OTP email.
// EMAIL_PASS must be a Gmail "app password" (16 characters), not the normal password.
// Uses Gmail by default; set EMAIL_SERVICE in .env if you use another provider.
async function sendMail({ to, subject, text, html }) {
  const resendApiKey = (process.env.RESEND_API_KEY || "").trim();

  // 1. Resend HTTPS API (Port 443 — works seamlessly on Render Free Tier where SMTP is blocked)
  if (resendApiKey) {
    const fromAddress = process.env.EMAIL_FROM || "CareSync <onboarding@resend.dev>";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: Array.isArray(to) ? to : [to],
        subject,
        text: text || "",
        html: html || (text ? `<p>${text}</p>` : ""),
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || `Resend email error: ${res.statusText}`);
    }
    return { provider: "resend", id: data.id };
  }

  // 2. Nodemailer SMTP (for localhost or hosts where SMTP ports are not blocked)
  const emailUser = String(process.env.EMAIL_USER || "").trim();
  const emailPass = String(process.env.EMAIL_PASS || "").replace(/\s+/g, "");

  if (!emailUser || !emailPass) {
    throw new Error("Email service not configured. Please set RESEND_API_KEY or EMAIL_USER and EMAIL_PASS.");
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
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
    to,
    subject,
    text,
    html,
  });
}
 
module.exports = { sendMail };