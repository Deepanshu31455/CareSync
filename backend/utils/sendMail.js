const nodemailer = require("nodemailer");
 
// Sends one email, using the same EMAIL_USER / EMAIL_PASS as the OTP email.
// EMAIL_PASS must be a Gmail "app password" (16 characters), not the normal password.
// Uses Gmail by default; set EMAIL_SERVICE in .env if you use another provider.
async function sendMail({ to, subject, html }) {
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
 
  return transporter.sendMail({
    from: `"CareSync" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
}
 
module.exports = { sendMail };