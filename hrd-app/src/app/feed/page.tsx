import { prisma } from "@/lib/prisma";
import Image from "next/image";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

function normalizeMedia(media: unknown): string[] {
  if (!media) return [];
  if (Array.isArray(media)) return media.filter(Boolean);
  if (typeof media === "string") return [media];
  if (typeof media === "object" && media !== null && "url" in media) {
    const url = (media as { url?: unknown }).url;
    if (typeof url === "string") return [url];
  }
  return [];
}

function isVideo(url?: string) {
  return !!url && /(\.mp4|\.webm|\.ogg)(\?|#|$)/i.test(url);
}

type PostWithAuthor = Prisma.PostGetPayload<{
  include: { author: { select: { name: true; photoUrl: true } } };
}>;

export default async function FeedPage() {
  let posts: PostWithAuthor[] = [];
  try {
    posts = await prisma.post.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      include: { author: { select: { name: true, photoUrl: true } } },
      take: 50,
    });
  } catch {
    posts = [];
  }

  return (
    <section className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Feed</h1>
      <div className="space-y-4">
        {posts.map((p) => {
          const media = normalizeMedia(p.media as unknown);
          const first = media[0];
          const showVideo = String(p.type).toUpperCase() === "VIDEO" || isVideo(first);
          const when = new Date(p.createdAt).toLocaleString();
          return (
            <article key={p.id} className="bg-white border rounded-xl shadow-sm overflow-hidden">
              {/* Header */}
              <div className="p-3 flex items-center gap-3">
                <Image
                  src={p.author?.photoUrl || ("https://ui-avatars.com/api/?name=" + encodeURIComponent(p.author?.name || "Member"))}
                  alt={p.author?.name || "Member"}
                  className="rounded-full object-cover bg-gray-100 border"
                  width={40}
                  height={40}
                />
                <div className="leading-tight">
                  <div className="font-semibold">{p.author?.name || "Member"}</div>
                  <div className="text-xs text-gray-500">{when}</div>
                </div>
              </div>

              {/* Content */}
              {p.content ? (
                <div className="px-3 pb-2 text-sm whitespace-pre-wrap">{p.content}</div>
              ) : null}

              {/* Media */}
              {first ? (
                <div className="bg-black/5">
                  {showVideo ? (
                    <video className="w-full max-h-[70vh] object-contain bg-black" src={first} controls preload="metadata" />
                  ) : (
                    <Image src={first} alt={p.title || "post media"} className="w-full object-contain bg-black" width={1920} height={1080} />
                  )}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
