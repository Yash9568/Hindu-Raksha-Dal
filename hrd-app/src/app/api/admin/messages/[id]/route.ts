import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(_req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session?.user || role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(_req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const idx = parts.lastIndexOf("messages");
  const id = idx >= 0 ? parts[idx + 1] : "";
  let body: any = {};
  try { body = await _req.json(); } catch {}
  const action = body?.action as "READ" | "ARCHIVED" | undefined;
  if (!action) return NextResponse.json({ error: "Missing action" }, { status: 400 });
  const updated = await prisma.contactMessage.update({ where: { id }, data: { status: action } });
  return NextResponse.json({ ok: true, message: updated });
}
