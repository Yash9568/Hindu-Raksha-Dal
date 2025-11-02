import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  let id: string | undefined = session?.user?.id;
  if (!id) {
    // Fallback: parse JWT directly
    const token = await getToken({ req: req as unknown as NextRequest, secret: process.env.NEXTAUTH_SECRET });
    id = token?.sub ?? undefined;
  }
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      photoUrl: true,
      role: true,
      createdAt: true,
      membership: { select: { memberId: true, issuedAt: true } },
    },
  });
  return NextResponse.json({ user });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  let id: string | undefined = session?.user?.id;
  if (!id) {
    const token = await getToken({ req: req as unknown as NextRequest, secret: process.env.NEXTAUTH_SECRET });
    id = token?.sub ?? undefined;
  }
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const { name, photoUrl, phone } = body as Record<string, unknown>;
  if (phone && typeof phone !== "string") {
    return NextResponse.json({ error: "Invalid phone" }, { status: 400 });
  }
  // Validate photoUrl: only allow http(s) URLs, reject data/base64 and overly long strings
  let safePhotoUrl: string | undefined = undefined;
  if (typeof photoUrl === "string") {
    const trimmed = photoUrl.trim();
    if (trimmed.length > 0) {
      if (!/^https?:\/\//i.test(trimmed)) {
        return NextResponse.json({ error: "photoUrl must be an http(s) URL" }, { status: 400 });
      }
      if (trimmed.length > 2048) {
        return NextResponse.json({ error: "photoUrl is too long" }, { status: 400 });
      }
      safePhotoUrl = trimmed;
    }
  }
  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(name ? { name: String(name) } : {}),
      ...(safePhotoUrl ? { photoUrl: safePhotoUrl } : {}),
      ...(phone ? { phone: String(phone) } : {}),
    },
    select: { id: true, name: true, email: true, phone: true, photoUrl: true, role: true },
  });
  return NextResponse.json({ user });
}

