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
                  { title: { contains: q, mode: "insensitive" } },
                  { content: { contains: q, mode: "insensitive" } },
                ],
              }
            : {},
          category ? { categories: { some: { slug: category } } } : {},
          tag ? { tags: { some: { slug: tag } } } : {},
        ],
      },
      orderBy: { createdAt: "desc" },
      include: { author: { select: { id: true, name: true } }, categories: true, tags: true },
      take: 50,
    });
    return NextResponse.json({ posts });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
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

    const authorId = (session.user as any).id as string;

    // Upsert categories/tags from comma separated strings
    const catList: string[] = (categories || "")
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
    const tagList: string[] = (tags || "")
      .split(",")
      .map((s: string) => s.trim().replace(/^#/, ""))
      .filter(Boolean);

    const catConnect = await Promise.all(
      catList.map(async (name) => {
        const slug = name.toLowerCase().replace(/\s+/g, "-");
        const c = await prisma.category.upsert({
          where: { slug },
          update: {},
          create: { name, slug },
        });
        return { id: c.id };
      })
    );

    const tagConnect = await Promise.all(
      tagList.map(async (name) => {
        const slug = name.toLowerCase().replace(/\s+/g, "-");
        const t = await prisma.tag.upsert({
          where: { slug },
          update: {},
          create: { name, slug },
        });
        return { id: t.id };
      })
    );

    const post = await prisma.post.create({
      data: {
        title,
        content,
        type: (type || "TEXT").toUpperCase(),
        status: "PENDING",
        author: { connect: { id: authorId } },
        categories: { connect: catConnect },
        tags: { connect: tagConnect },
        media: media ?? null,
      },
      include: { categories: true, tags: true },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
