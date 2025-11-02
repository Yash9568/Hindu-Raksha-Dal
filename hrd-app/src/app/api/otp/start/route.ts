import { NextResponse } from "next/server";
import crypto from "node:crypto";

export const runtime = "nodejs";

function base64url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function sign(payload: Record<string, unknown>, secret: string, expiresInSec = 300) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const pl = { ...payload, iat: now, exp: now + expiresInSec };
  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(pl));
  const data = `${headerB64}.${payloadB64}`;
  const sig = crypto.createHmac("sha256", secret).update(data).digest();
  const sigB64 = base64url(sig);
  return `${data}.${sigB64}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const raw = String((body as Record<string, unknown>).phone || "");
    const phone = raw.replace(/\D+/g, "");
    if (!phone) return NextResponse.json({ error: "Phone required" }, { status: 400 });
    if (!process.env.NEXTAUTH_SECRET) return NextResponse.json({ error: "OTP disabled" }, { status: 500 });

    const code = (Math.floor(100000 + Math.random() * 900000)).toString();
    const token = sign({ phone, code }, process.env.NEXTAUTH_SECRET, 5 * 60);

    const sid = process.env.TWILIO_ACCOUNT_SID || "";
    const auth = process.env.TWILIO_AUTH_TOKEN || "";
    const from = process.env.TWILIO_FROM_NUMBER || "";
    if (sid && auth && from) {
      try {
        const to = phone.startsWith("+") ? phone : (phone.length === 10 ? `+91${phone}` : `+${phone}`);
        const params = new URLSearchParams();
        params.set("From", from);
        params.set("To", to);
        params.set("Body", `Your OTP code is ${code}`);
        const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: "Basic " + Buffer.from(`${sid}:${auth}`).toString("base64"),
          },
          body: params,
        });
        if (!resp.ok) {
          const j = await resp.json().catch(() => ({} as Record<string, unknown>));
          const msg = (j as Record<string, unknown>).message;
          return NextResponse.json({ error: typeof msg === "string" ? msg : "SMS send failed" }, { status: 500 });
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "SMS error";
        return NextResponse.json({ error: message }, { status: 500 });
      }
      return NextResponse.json({ message: "OTP sent", token }, { status: 200 });
    }
    return NextResponse.json({ message: "OTP sent", token, devCode: process.env.NODE_ENV !== "production" ? code : undefined }, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
