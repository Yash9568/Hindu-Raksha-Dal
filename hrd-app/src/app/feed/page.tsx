import { prisma } from "@/lib/prisma";
import Image from "next/image";
import type { Prisma } from "@prisma/client";
import DeletePostButton from "@/components/DeletePostButton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

function normalizeMedia(media: unknown): string[] {
  if (!media) return [];
  // If media is already an array, flatten one level
  const arr = Array.isArray(media) ? media : [media];
  const flat = arr.flatMap((x) => (Array.isArray(x) ? x : [x]));
  const pickUrl = (m: any): string => {
    if (typeof m === "string") return m;
    return (
      m?.url || m?.secure_url || m?.src || m?.path || m?.link || ""
    );
  };
  // If any item is a JSON string, try parse
  const expandParsed = flat.flatMap((m) => {
    if (typeof m === "string") {
      const s = m.trim();
      if (s.startsWith("[") || s.startsWith("{")) {
        try {
          const parsed = JSON.parse(s);
          const arr2 = Array.isArray(parsed) ? parsed : [parsed];
          return arr2;
        } catch {
          return [m];
        }
      }
    }
    return [m];
  });
  // Upgrade http->https to avoid mixed-content blocking on HTTPS sites
  const upgrade = (u: string) => (u.startsWith("http://") ? u.replace("http://", "https://") : u);
  return expandParsed.map(pickUrl).filter(Boolean).map(upgrade);
}

function isVideo(url?: string) {
  return !!url && /(\.mp4|\.webm|\.ogg)(\?|#|$)/i.test(url);
}

type PostWithAuthor = Prisma.PostGetPayload<{
  include: { author: { select: { name: true; photoUrl: true } } };
}>;

export default async function FeedPage() {
  const session = await getServerSession(authOptions);
  const myId = session?.user?.id;
  let posts: PostWithAuthor[] = [];
  try {
    posts = await prisma.post.findMany({
      where: myId
        ? {
            OR: [
              { status: "APPROVED" },
              { AND: [{ status: "PENDING" }, { authorId: myId }] },
            ],
          }
        : { status: "APPROVED" },
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
                <DeletePostButton postId={p.id} authorId={(p as any).authorId} className="ml-auto px-3 py-1 rounded border text-red-700 hover:bg-red-50" />
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
                    <img src={first} alt={p.title || "post media"} className="w-full object-contain bg-black" />
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
