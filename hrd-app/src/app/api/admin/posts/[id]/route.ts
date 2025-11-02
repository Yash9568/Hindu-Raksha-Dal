import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (!session?.user || role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const action = String((body as Record<string, unknown>).action || "").toLowerCase();
  if (!id || ["approve", "reject"].includes(action) === false) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const status = action === "approve" ? "APPROVED" : "REJECTED";
  const post = await prisma.post.update({ where: { id }, data: { status } });
  return NextResponse.json({ post });
}
