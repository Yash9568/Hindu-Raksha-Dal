import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";

function pad(n: number, width = 5) {
  const s = String(n);
  return s.length >= width ? s : new Array(width - s.length + 1).join("0") + s;
}

async function generateUniqueMemberId(): Promise<string> {
  const year = new Date().getFullYear();
  for (let i = 0; i < 5; i++) {
    const seq = Math.floor(Math.random() * 99999);
    const candidate = `HRD-${year}-${pad(seq)}`;
    const exists = await prisma.membership.findUnique({ where: { memberId: candidate } });
    if (!exists) return candidate;
  }
  return `HRD-${year}-${Date.now().toString().slice(-5)}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = (body?.name || "").toString().trim();
    const phone = (body?.phone || "").toString().trim();
    const emailRaw = (body?.email || "").toString().trim();

    if (!name || !phone) {
      return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
    }

    // Create a safe placeholder email if not provided, to satisfy unique constraints
    const email = emailRaw || `${phone}@placeholder.local`;

    // Find-or-create user by unique phone
    const placeholderHash = await hashPassword(Math.random().toString(36).slice(2));
    const user = await prisma.user.upsert({
      where: { phone },
      update: { name, email },
      create: { name, email, phone, passwordHash: placeholderHash },
      select: { id: true, name: true, email: true, phone: true },
    });

    // Find existing membership for this user
    let membership = await prisma.membership.findFirst({
      where: { userId: user.id },
      orderBy: { issuedAt: "desc" },
      select: { id: true, memberId: true, issuedAt: true, userId: true },
    });

    if (!membership) {
      const memberId = await generateUniqueMemberId();
      membership = await prisma.membership.create({
        data: { userId: user.id, memberId, issuedAt: new Date() },
        select: { id: true, memberId: true, issuedAt: true, userId: true },
      });
    }

    return NextResponse.json({ user, membership }, { status: 200 });
  } catch (e: any) {
    console.error("/api/membership/lookup error", e);
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}
