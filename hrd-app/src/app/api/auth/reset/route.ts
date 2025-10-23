import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "node:crypto";
import { hashPassword } from "@/lib/hash";

export const runtime = "nodejs";

function b64urlToBuf(b64url: string) {
  const pad = 4 - (b64url.length % 4 || 4);
  const b64 = (b64url + "====".slice(0, pad)).replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(b64, "base64");
}

function verify(token: string, secret: string) {
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
  return payload as { sub: string; email?: string };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = (body?.token || "").trim();
    const password = (body?.password || "").trim();
    if (!token || !password) return NextResponse.json({ error: "Missing token/password" }, { status: 400 });
    if (!process.env.NEXTAUTH_SECRET) return NextResponse.json({ error: "Reset disabled" }, { status: 500 });

    const payload = verify(token, process.env.NEXTAUTH_SECRET);
    const id = payload.sub;
    if (!id) return NextResponse.json({ error: "Invalid token" }, { status: 400 });

    const passwordHash = await hashPassword(password);
    await prisma.user.update({ where: { id }, data: { passwordHash } });

    return NextResponse.json({ message: "Password updated" }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 400 });
  }
}
