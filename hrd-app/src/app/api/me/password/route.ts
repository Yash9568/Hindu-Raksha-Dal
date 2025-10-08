import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/hash";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = (session.user as any).id as string;
  const { oldPassword, newPassword } = await req.json().catch(() => ({}) as any);
  if (!oldPassword || !newPassword) {
    return NextResponse.json({ error: "Missing passwords" }, { status: 400 });
  }
  if (String(newPassword).length < 6) {
    return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
  }

  const u = await prisma.user.findUnique({ where: { id } });
  if (!u) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const ok = await verifyPassword(oldPassword, u.passwordHash);
  if (!ok) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });

  const newHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id }, data: { passwordHash: newHash } });
  return NextResponse.json({ ok: true });
}
