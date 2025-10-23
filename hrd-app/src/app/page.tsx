import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PostActions from "@/components/PostActions";
import HeroImage from "@/components/HeroImage";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const loggedIn = !!session?.user;
  let posts: any[] = [];
  try {
    posts = await prisma.post.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      include: { author: { select: { name: true } } },
      take: 6,
    });
  } catch (e) {
    // In case DB is unavailable or auth fails, render page without feed rather than crashing
    posts = [];
  }
  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="bg-white rounded-lg shadow p-6">
        <div className="grid md:grid-cols-2 gap-6 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-3">Welcome to Hindu Raksha Dal</h2>
            <p className="mb-4">
              A community platform to share knowledge about Hindu culture,
              traditions, festivals, and values. Join us, contribute posts, and
              become a proud member.
            </p>
            <div className="flex gap-3">
              {loggedIn && (
                <Link href="/posts" className="bg-[#FF9933] text-white px-4 py-2 rounded">
                  Create a Post
                </Link>
              )}
              <Link
                href="/membership"
                className="border border-[#FF9933] text-[#FF9933] px-4 py-2 rounded"
              >
                Get Membership
              </Link>
            </div>
          </div>
          <HeroImage alt="Hindu Raksha Dal Emblem" className="rounded-lg w-full h-48 md:h-56 object-contain bg-white" />
        </div>
      </section>

      {/* Home Feed (vertical) */}
      <section className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold">Feed</h3>
          {loggedIn && (
            <Link href="/posts" className="text-[#FF9933] hover:underline font-medium">Create a Post</Link>
          )}
        </div>
        <div className="space-y-4">
          {posts.length === 0 ? (
            <p className="text-sm text-gray-600">No posts yet. Be the first to create one!</p>
          ) : (
            posts.map((p: any) => {
              const type = String(p.type || "TEXT").toUpperCase();
              // Normalize media JSON into URL strings from various shapes
              let mediaRaw: any[] = Array.isArray(p.media)
                ? p.media
                : p.media && typeof p.media === "object"
                ? [p.media]
                : [];
              // If media is a JSON string, try to parse
              if (typeof p.media === "string" && p.media) {
                const s = p.media.trim();
                if (s.startsWith("[") || s.startsWith("{")) {
                  try {
                    const parsed = JSON.parse(s);
                    mediaRaw = Array.isArray(parsed) ? parsed : [parsed];
                  } catch {
                    mediaRaw = [p.media];
                  }
                } else {
                  mediaRaw = [p.media];
                }
              }
              function pickUrl(m: any): string {
                if (typeof m === "string") return m;
                return (
                  m?.url ||
                  m?.secure_url ||
                  m?.src ||
                  m?.path ||
                  m?.link ||
                  ""
                );
              }
              // Flatten one level in case parsed JSON was nested like { urls: [...] }
              const flattenOnce = (arr: any[]): any[] =>
                arr.flatMap((x) => (Array.isArray(x) ? x : [x]));
              let media: string[] = flattenOnce(mediaRaw)
                .map(pickUrl)
                .filter(Boolean);
              if (media.length === 0 && typeof p.content === "string") {
                // Fallback 1: extract first bare URL
                const match1 = p.content.match(/https?:[^\s)"'>]+/i);
                if (match1) media = [match1[0]];
                // Fallback 2: extract from HTML tags like <img src="..."> or <video src='...'>
                if (media.length === 0) {
                  const match2 = p.content.match(/<\s*(?:img|video)[^>]*src=["']([^"']+)["']/i);
                  if (match2 && match2[1]) media = [match2[1]];
                }
              }
              const first = media[0] as string | undefined;
              const second = media[1] as string | undefined;
              const third = media[2] as string | undefined;
              const isVideo = (url?: string) => !!url && /(\.mp4|\.webm|\.ogg)(\?|#|$)/i.test(url);
              const isImage = (url?: string) => !!url && /(\.png|\.jpe?g|\.gif|\.webp|\.avif|\.svg)(\?|#|$)/i.test(url);
              return (
                <article key={p.id} id={`post-${p.id}`} className="bg-white border rounded-xl shadow-sm overflow-hidden">
                  {/* Header: avatar + name + time */}
                  <div className="p-3 flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.author?.photoUrl || ("https://ui-avatars.com/api/?name=" + encodeURIComponent(p.author?.name || "Member"))}
                      alt={p.author?.name || "Member"}
                      className="w-10 h-10 rounded-full object-cover bg-gray-100 border"
                    />
                    <div className="leading-tight">
                      <div className="font-semibold">{p.author?.name || "Member"}</div>
                      <div className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleString()}</div>
                    </div>
                    <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full bg-white border ${
                      type === "VIDEO" ? "border-purple-200 text-purple-700" : type === "IMAGE" ? "border-blue-200 text-blue-700" : "border-gray-200 text-gray-700"
                    }`}>{type}</span>
                  </div>

                  {/* Text content */}
                  {p.content ? (
                    <div className="px-3 pb-2 text-sm whitespace-pre-wrap">{p.content}</div>
                  ) : null}

                  {/* Media (single primary item) */}
                  {first ? (
                    <div className="bg-black/5">
                      {type === "VIDEO" || isVideo(first) ? (
                        <video className="w-full max-h-[70vh] object-contain bg-black" src={first} controls preload="metadata" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={first} alt={p.title} className="w-full object-contain bg-black" />
                      )}
                    </div>
                  ) : null}

                  {/* Actions: like / share / comment */}
                  <PostActions postId={p.id} title={p.title} />
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
