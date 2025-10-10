import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
  // Fallback if unlikely collisions persist
  return `HRD-${year}-${Date.now().toString().slice(-5)}`;
}

// Public: does NOT require auth and does NOT create a DB record.
export async function POST() {
  const memberId = await generateUniqueMemberId();
  return NextResponse.json({ memberId }, { status: 200 });
}
