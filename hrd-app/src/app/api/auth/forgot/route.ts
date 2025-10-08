import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "node:crypto";

function base64url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function sign(payload: any, secret: string, expiresInSec = 900) {
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
    const email = (body?.email || "").toLowerCase().trim();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    // Always respond success to avoid user enumeration
    if (!process.env.NEXTAUTH_SECRET) {
      return NextResponse.json({ message: "Reset disabled: missing NEXTAUTH_SECRET" }, { status: 200 });
    }
    if (!user) {
      return NextResponse.json({ message: "If the account exists, a reset link was generated.", resetUrl: null }, { status: 200 });
    }

    const token = sign({ sub: user.id, email }, process.env.NEXTAUTH_SECRET, 15 * 60);
    const origin = (process.env.NEXT_PUBLIC_APP_ORIGIN || "");
    const base = origin || (new URL(req.url)).origin;
    const resetUrl = `${base}/reset?token=${encodeURIComponent(token)}`;

    // NOTE: In production, send this link via email. For now, return it so user can copy.
    return NextResponse.json({ message: "Reset link generated", resetUrl }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
