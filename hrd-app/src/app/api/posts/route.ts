import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/posts?q=&category=&tag=
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const category = searchParams.get("category")?.trim();
    const tag = searchParams.get("tag")?.trim();

    const posts = await prisma.post.findMany({
      where: {
        status: "APPROVED",
        AND: [
          q
            ? {
                OR: [
                  { title: { contains: q } },
                  { content: { contains: q } },
                ],
              }
            : {},
          category ? { categories: { has: category } } : {},
          tag ? { tags: { has: tag?.replace(/^#/, "") } } : {},
        ],
      },
      orderBy: { createdAt: "desc" },
      include: { author: { select: { id: true, name: true, photoUrl: true } } },
      take: 50,
    });
    return NextResponse.json({ posts });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/posts
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, content, type, categories, tags, media } = body || {};
    if (!title || !content) return NextResponse.json({ error: "Missing title/content" }, { status: 400 });

    const authorId = session.user.id;

    // Prepare categories/tags from comma separated strings (denormalized)
    const catList: string[] = (categories || "")
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
    const tagList: string[] = (tags || "")
      .split(",")
      .map((s: string) => s.trim().replace(/^#/, ""))
      .filter(Boolean);

    const post = await prisma.post.create({
      data: {
        title,
        content,
        type: (type || "TEXT").toUpperCase(),
        status: "PENDING",
        author: { connect: { id: authorId } },
        categories: catList,
        tags: tagList,
        media: media ?? null,
      },
      include: {},
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
