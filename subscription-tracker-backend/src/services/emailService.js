const nodemailer = require("nodemailer");

let transporterPromise;

function getTransporter() {
  if (!transporterPromise) {
    transporterPromise = (async () => {
      if (process.env.SMTP_HOST) {
        return nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: process.env.SMTP_PORT === "465",
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
      }
      const account = await nodemailer.createTestAccount();
      console.log("No SMTP settings found, using an Ethereal test inbox");
      return nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: { user: account.user, pass: account.pass },
      });
    })();
  }
  return transporterPromise;
}

exports.sendMail = async ({ to, subject, text, html }) => {
  if (process.env.RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM || "Subscription Tracker <onboarding@resend.dev>",
        to: [to],
        subject,
        text,
        html,
      }),
    });
    if (!res.ok) throw new Error(`Resend error ${res.status}: ${await res.text()}`);
    return res.json();
  }

  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM || '"Subscription Tracker" <no-reply@example.com>',
    to,
    subject,
    text,
    html,
  });
  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) console.log("Preview email:", preview);
  return info;
};