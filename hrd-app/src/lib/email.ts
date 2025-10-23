import nodemailer from "nodemailer";

export async function sendEmail(to: string, subject: string, html: string) {
  const host = process.env.EMAIL_SERVER || "";
  const portStr = process.env.EMAIL_PORT || "";
  const user = process.env.EMAIL_USER || "";
  const pass = process.env.EMAIL_PASSWORD || "";
  const from = process.env.EMAIL_FROM || "";
  const port = Number(portStr || 0);
  const secure = port === 465 || process.env.EMAIL_SECURE === "true";
  if (!host || !port || !user || !pass || !from) {
    return { ok: false, error: "Email not configured" };
  }
  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
    await transporter.sendMail({ from, to, subject, html });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Send error" };
  }
}
