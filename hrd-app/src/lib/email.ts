import nodemailer from "nodemailer";

export async function sendEmail(to: string, subject: string, html: string) {
  const host = process.env.EMAIL_SERVER || "";
  const portStr = process.env.EMAIL_PORT || "";
  const user = process.env.EMAIL_USER || "";
  const pass = process.env.EMAIL_PASSWORD || "";
  const from = process.env.EMAIL_FROM || "";
  const port = Number(portStr || 0);
  const secure = port === 465 || process.env.EMAIL_SECURE === "true";

  // If SMTP is configured, try it first
  if (host && port && user && pass && from) {
    try {
      const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
      await transporter.sendMail({ from, to, subject, html });
      return { ok: true };
    } catch (e: any) {
      // Log for server diagnostics, do not leak to client
      console.error("SMTP sendEmail error:", e?.message || e);
      // fall through to possible Resend fallback
    }
  }

  // Resend fallback (no SMTP or SMTP failed). Many hosts block SMTP; Resend works over HTTPS.
  const resendKey = process.env.RESEND_API_KEY || "";
  if (resendKey && from) {
    try {
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({ from, to, subject, html }),
      });
      if (!resp.ok) {
        const errText = await resp.text().catch(() => "");
        console.error("Resend sendEmail error:", resp.status, errText);
        return { ok: false, error: `Resend error ${resp.status}` };
      }
      return { ok: true };
    } catch (e: any) {
      console.error("Resend sendEmail exception:", e?.message || e);
      return { ok: false, error: e?.message || "Send error" };
    }
  }

  return { ok: false, error: "Email not configured" };
}
