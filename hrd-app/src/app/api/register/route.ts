import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, password, photoUrl } = body || {};
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const phoneNormRaw = String(phone || "").trim();
    const phoneDigits = phoneNormRaw.replace(/\D+/g, "");
    if (!phoneDigits) {
      return NextResponse.json({ error: "Phone is required" }, { status: 400 });
    }

    const emailNorm = String(email).toLowerCase().trim();

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailNorm },
          { phone: phoneDigits },
        ],
      },
    });
    if (existing) {
      return NextResponse.json({ error: "User with email or phone already exists" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email: emailNorm, phone: phoneDigits, photoUrl: photoUrl || null, passwordHash },
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
