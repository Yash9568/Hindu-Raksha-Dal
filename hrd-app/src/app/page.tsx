import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const posts = await prisma.post.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    include: { categories: true, tags: true, author: { select: { name: true } } },
    take: 6,
  });
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
              <Link href="/posts" className="bg-[#FF9933] text-white px-4 py-2 rounded">
                Create a Post
              </Link>
              <Link
                href="/membership"
                className="border border-[#FF9933] text-[#FF9933] px-4 py-2 rounded"
              >
                Get Membership
              </Link>
            </div>
          </div>
          <img
            alt="Culture"
            className="rounded-lg w-full h-64 object-cover"
            src="https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=1200&auto=format&fit=crop"
          />
        </div>
      </section>

      {/* Latest posts */}
      <section className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Latest Posts</h3>
          <Link href="/posts" className="text-[#FF9933] hover:underline">
            Browse all
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {posts.length === 0 ? (
            <p className="text-sm text-gray-600">No posts yet. Be the first to create one!</p>
          ) : (
            posts.map((p: any) => {
              const type = String(p.type || "TEXT").toUpperCase();
              const media: string[] = Array.isArray(p.media)
                ? p.media
                : (typeof p.media === "string" && p.media)
                ? [p.media]
                : [];
              const first = media[0] as string | undefined;
              return (
                <article key={p.id} className="border rounded overflow-hidden bg-white">
                  {first && type === "IMAGE" && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={first} alt={p.title} className="w-full h-40 object-cover" />
                  )}
                  {first && type === "VIDEO" && (
                    <video className="w-full h-40 object-cover" src={first} controls />
                  )}
                  <div className="p-3">
                    <div className="text-xs text-gray-500 mb-1">by {p.author?.name || "Member"}</div>
                    <h4 className="font-semibold line-clamp-1">{p.title}</h4>
                    <p className="text-sm text-gray-600 line-clamp-3 mt-1">{p.content}</p>
                    <div className="text-xs text-gray-400 mt-2">
                      {p.categories.map((c: { name: string }) => c.name).join(", ") || "General"}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
