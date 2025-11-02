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
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {} as Record<string, unknown>;
  }
  const actionRaw = body.action;
  const action = typeof actionRaw === "string" ? actionRaw.toUpperCase() : "";
  if (!["READ", "ARCHIVED"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const updated = await prisma.contactMessage.update({
    where: { id },
    data: { status: action as "READ" | "ARCHIVED" },
    select: { id: true, status: true },
  });
  return NextResponse.json({ message: updated });
}
