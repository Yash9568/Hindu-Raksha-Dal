import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, password, photoUrl } = body || {};
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const emailNorm = String(email).toLowerCase().trim();
    const phoneNorm = phone ? String(phone).trim() : null;
    const phoneDigits = phoneNorm ? phoneNorm.replace(/\D+/g, "") : null;

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailNorm },
          ...(phoneDigits ? [{ phone: phoneDigits }] as const : []),
        ],
      },
    });
    if (existing) {
      return NextResponse.json({ error: "User with email or phone already exists" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email: emailNorm, phone: phoneDigits || null, photoUrl, passwordHash },
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
