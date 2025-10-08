import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const { name, email, phone, subject, message } = body || {};
    if (!name || !message) {
      return NextResponse.json({ error: "Name and message are required" }, { status: 400 });
    }
    const saved = await prisma.contactMessage.create({
      data: { name, email, phone, subject, message },
      select: { id: true, createdAt: true },
    });
    return NextResponse.json({ ok: true, id: saved.id }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
