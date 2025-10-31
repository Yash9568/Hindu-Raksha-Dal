import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST || "";
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";
  const secure = (process.env.SMTP_SECURE || "").toLowerCase() === "true" || port === 465;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  });
  return transporter;
}

export async function sendEmail(to: string, subject: string, html: string) {
  const from = process.env.EMAIL_FROM || "";
  const host = process.env.SMTP_HOST || "";
  const port = process.env.SMTP_PORT || "";
  if (!from || !host || !port) return { ok: false, error: "SMTP not configured" };
  try {
    const tx = getTransporter();
    await tx.sendMail({ from, to, subject, html });
    return { ok: true };
  } catch (e: any) {
    console.error("Nodemailer error:", e?.message || e);
    return { ok: false, error: e?.message || "Send error" };
  }
}

export async function sendResetEmail(email: string, resetLink: string) {
  const subject = "Password Reset Link";
  const html = `
    <p>Click below to reset your password:</p>
    <a href="${resetLink}">${resetLink}</a>
  `;
  const res = await sendEmail(email, subject, html);
  return !!res.ok;
}
