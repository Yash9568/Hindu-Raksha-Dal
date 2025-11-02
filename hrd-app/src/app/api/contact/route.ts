import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const { name, email, phone, subject, message } = body as Record<string, unknown>;
    if (!name || !message) {
      return NextResponse.json({ error: "Name and message are required" }, { status: 400 });
    }
    const saved = await prisma.contactMessage.create({
      data: { name: String(name), email: email ? String(email) : null, phone: phone ? String(phone) : null, subject: subject ? String(subject) : null, message: String(message) },
      select: { id: true, createdAt: true },
    });
    return NextResponse.json({ ok: true, id: saved.id }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
