import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  context: any
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session?.user || role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = context?.params?.id as string;
  const body = await req.json().catch(() => ({}));
  const action = String(body?.action || "").toLowerCase();
  if (!id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const status = action === "approve" ? "APPROVED" : "REJECTED";
  const post = await prisma.post.update({ where: { id }, data: { status } });
  return NextResponse.json({ post });
}
