const nodemailer = require("nodemailer");
 
// Sends one email, using the same EMAIL_USER / EMAIL_PASS as the OTP email.
// EMAIL_PASS must be a Gmail "app password" (16 characters), not the normal password.
// Uses Gmail by default; set EMAIL_SERVICE in .env if you use another provider.
async function sendMail({ to, subject, html }) {
  const emailUser = String(process.env.EMAIL_USER || "").trim();
  const emailPass = String(process.env.EMAIL_PASS || "").replace(/\s+/g, "");

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
    html,
  });
}
 
module.exports = { sendMail };