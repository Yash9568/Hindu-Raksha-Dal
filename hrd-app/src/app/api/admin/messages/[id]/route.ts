import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params;

  // Example: read JSON body
  const body = await request.json();

  // TODO: update message in DB here
  return NextResponse.json(
    { success: true, id, data: body },
    { status: 200 }
  );
}
