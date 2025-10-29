import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  let session = await getServerSession(authOptions);
  let id = (session?.user as any)?.id as string | undefined;
  if (!id) {
    // Fallback: parse JWT directly
    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    id = token?.sub as string | undefined;
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
  let session = await getServerSession(authOptions);
  let id = (session?.user as any)?.id as string | undefined;
  if (!id) {
    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    id = token?.sub as string | undefined;
  }
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({} as any));
  const { name, photoUrl, phone } = body || {};
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
      ...(name ? { name } : {}),
      ...(safePhotoUrl ? { photoUrl: safePhotoUrl } : {}),
      ...(phone ? { phone } : {}),
    },
    select: { id: true, name: true, email: true, phone: true, photoUrl: true, role: true },
  });
  return NextResponse.json({ user });
}

