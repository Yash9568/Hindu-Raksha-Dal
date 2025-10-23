import { NextResponse } from "next/server";
import crypto from "node:crypto";

export const runtime = "nodejs";

function b64urlToBuf(b64url: string) {
  const pad = 4 - (b64url.length % 4 || 4);
  const b64 = (b64url + "====".slice(0, pad)).replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(b64, "base64");
}

function verifyJwt(token: string, secret: string) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid token");
  const [h, p, s] = parts;
  const data = `${h}.${p}`;
  const expected = crypto.createHmac("sha256", secret).update(data).digest();
  const got = b64urlToBuf(s);
  if (expected.length !== got.length || !crypto.timingSafeEqual(expected, got)) throw new Error("Bad signature");
  const payload = JSON.parse(Buffer.from(p, "base64").toString("utf8"));
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && now > payload.exp) throw new Error("Expired");
  return payload as { phone: string; code: string };
}

function base64url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function sign(payload: any, secret: string, expiresInSec = 600) {
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
    const body = await req.json().catch(() => ({}));
    const token = String(body?.token || "").trim();
    const code = String(body?.code || "").trim();
    if (!token || !code) return NextResponse.json({ error: "Missing token/code" }, { status: 400 });
    if (!process.env.NEXTAUTH_SECRET) return NextResponse.json({ error: "OTP disabled" }, { status: 500 });

    const payload = verifyJwt(token, process.env.NEXTAUTH_SECRET);
    if (!payload || payload.code !== code) return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });

    const verifiedToken = sign({ phone: payload.phone, verified: true }, process.env.NEXTAUTH_SECRET, 10 * 60);

    return NextResponse.json({ message: "OTP verified", token: verifiedToken });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
