import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function pad(n: number, width = 5) {
  const s = String(n);
  return s.length >= width ? s : new Array(width - s.length + 1).join("0") + s;
}

async function generateUniqueMemberId(): Promise<string> {
  const year = new Date().getFullYear();
  // Try up to a few times to avoid rare collisions
  for (let i = 0; i < 5; i++) {
    const seq = Math.floor(Math.random() * 99999);
    const candidate = `HRD-${year}-${pad(seq)}`;
    const exists = await prisma.membership.findUnique({ where: { memberId: candidate } });
    if (!exists) return candidate;
  }
  // Fallback: use cuid if too many collisions
  const fallback = `HRD-${year}-${Date.now().toString().slice(-5)}`;
  return fallback;
}

export async function POST(req: Request) {
  // Identify user from session or token
  let session = await getServerSession(authOptions);
  let userId = (session?.user as any)?.id as string | undefined;
  if (!userId) {
    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    userId = (token?.sub as string) || undefined;
  }
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // If already has membership, return it
  const existing = await prisma.membership.findUnique({ where: { userId } }).catch(async () => {
    return prisma.membership.findFirst({ where: { userId } });
  });
  if (existing) return NextResponse.json({ membership: existing }, { status: 200 });

  const memberId = await generateUniqueMemberId();
  const created = await prisma.membership.create({
    data: {
      userId,
      memberId,
      issuedAt: new Date(),
    },
    select: { id: true, memberId: true, issuedAt: true },
  });
  return NextResponse.json({ membership: created }, { status: 201 });
}
