"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import DeletePostButton from "@/components/DeletePostButton";

function normalizeMedia(media: unknown): string[] {
  if (!media) return [];
  const arr = Array.isArray(media) ? media : [media];
  const flat = arr.flatMap((x) => (Array.isArray(x) ? x : [x]));
  const pickUrl = (m: any): string => {
    if (typeof m === "string") return m;
    return m?.url || m?.secure_url || m?.src || m?.path || m?.link || "";
  };
  const expanded = flat.flatMap((m) => {
    if (typeof m === "string") {
      const s = m.trim();
      if (s.startsWith("[") || s.startsWith("{")) {
        try {
          const parsed = JSON.parse(s);
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          return [m];
        }
      }
    }
    return [m];
  });
  const upgrade = (u: string) => (u.startsWith("http://") ? u.replace("http://", "https://") : u);
  return expanded.map(pickUrl).filter(Boolean).map(upgrade);
}

function looksVideo(url?: string) {
  return !!url && /\.(mp4|webm|ogg)(\?|#|$)/i.test(url);
}

type Media = string | { url: string } | string[] | null | undefined;
type Post = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  type: "TEXT" | "IMAGE" | "VIDEO";
  media?: Media; // JSON field: expected array of URLs or single URL
  author: { id: string; name: string | null; email: string | null };
};

type ContactMessage = {
  id: string;
  createdAt: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  subject?: string | null;
  message: string;
  status: "NEW" | "READ" | "ARCHIVED";
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [msgQuery, setMsgQuery] = useState("");
  const [msgStatus, setMsgStatus] = useState<"ALL" | "NEW" | "READ" | "ARCHIVED">("ALL");
  const role = session?.user?.role;
  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.push("/login");
      return;
    }
    if (role !== "ADMIN") {
      alert("Admin access only");
      router.push("/");
      return;
    }
    (async () => {
      setLoading(true);
      const res = await fetch("/api/admin/posts");
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
      const m = await fetch("/api/admin/messages");
      if (m.ok) {
        const data = await m.json();
        setMessages(data.messages || []);
      }
      setLoading(false);
    })();
  }, [status, session, role, router]);

  async function act(id: string, action: "approve" | "reject") {
    const res = await fetch(`/api/admin/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data?.error || "Action failed");
    }
  }

  async function markMessage(id: string, action: "READ" | "ARCHIVED") {
    const res = await fetch(`/api/admin/messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: action } : m)));
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data?.error || "Action failed");
    }
  }

  if (loading) return <p>Loading…</p>;

  return (
    <div className="space-y-8">
      {/* Metrics */}
      <section className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs text-gray-500">Pending Posts</div>
          <div className="text-2xl font-semibold">{posts.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs text-gray-500">New Messages</div>
          <div className="text-2xl font-semibold">{messages.filter(m => m.status === "NEW").length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs text-gray-500">All Messages</div>
          <div className="text-2xl font-semibold">{messages.length}</div>
        </div>
      </section>
      <section className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Pending Posts</h3>
        {posts.length === 0 ? (
          <p className="text-sm text-gray-600">No pending posts.</p>
        ) : (
          <ul className="space-y-3">
            {posts.map((p) => {
              const mediaArr = normalizeMedia(p.media as unknown);
              const first = mediaArr[0];
              const isVideo = p.type === "VIDEO" || looksVideo(first);
              return (
                <li key={p.id} className="border rounded p-3">
                  <div className="flex items-start gap-3 justify-between">
                    <div className="flex items-start gap-3">
                      {/* Media thumbnail */}
                      <div className="w-32 h-20 bg-gray-100 border rounded overflow-hidden flex items-center justify-center">
                        {first ? (
                          isVideo ? (
                            <video src={first} className="w-full h-full object-cover" controls preload="metadata" />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={first} className="w-full h-full object-cover" alt="media" />
                          )
                        ) : (
                          <span className="text-xs text-gray-400">No media</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="font-semibold">{p.title}</div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${p.type === "VIDEO" ? "border-purple-300 text-purple-700 bg-purple-50" : p.type === "IMAGE" ? "border-blue-300 text-blue-700 bg-blue-50" : "border-gray-300 text-gray-700 bg-gray-50"}`}>
                            {p.type}
                          </span>
                          <DeletePostButton postId={p.id} authorId={p.author.id} />
                        </div>
                        <div className="text-xs text-gray-500">by {p.author?.name || p.author?.email || "Unknown"}</div>
                        <p className="text-sm mt-2 whitespace-pre-wrap max-w-[60ch] line-clamp-3">{p.content}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="bg-green-600 text-white px-3 py-1 rounded"
                        onClick={() => act(p.id, "approve")}
                      >
                        Approve
                      </button>
                      <button
                        className="bg-red-600 text-white px-3 py-1 rounded"
                        onClick={() => act(p.id, "reject")}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Contact Messages</h3>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <input
            className="border rounded px-3 py-2 w-64"
            placeholder="Search name, email, phone, subject, message"
            value={msgQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMsgQuery(e.target.value)}
          />
          <select
            className="border rounded px-3 py-2"
            value={msgStatus}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setMsgStatus(e.target.value as "ALL" | "NEW" | "READ" | "ARCHIVED")
            }
          >
            <option value="ALL">All</option>
            <option value="NEW">New</option>
            <option value="READ">Read</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
        {messages.length === 0 ? (
          <p className="text-sm text-gray-600">No messages.</p>
        ) : (
          <ul className="space-y-3">
            {messages
              .filter((m) => (msgStatus === "ALL" ? true : m.status === msgStatus))
              .filter((m) => {
                const q = msgQuery.trim().toLowerCase();
                if (!q) return true;
                return (
                  m.name.toLowerCase().includes(q) ||
                  (m.email || "").toLowerCase().includes(q) ||
                  (m.phone || "").toLowerCase().includes(q) ||
                  (m.subject || "").toLowerCase().includes(q) ||
                  m.message.toLowerCase().includes(q)
                );
              })
              .map((m) => (
              <li key={m.id} className="border rounded p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{m.name} <span className="text-xs text-gray-500">({m.status})</span></div>
                    <div className="text-xs text-gray-500">{m.email || "—"} {m.phone ? `• ${m.phone}` : ""}</div>
                    {m.subject && <div className="text-sm mt-1">{m.subject}</div>}
                  </div>
                  <div className="flex gap-2">
                    <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={() => markMessage(m.id, "READ")}>Mark Read</button>
                    <button className="bg-gray-600 text-white px-3 py-1 rounded" onClick={() => markMessage(m.id, "ARCHIVED")}>Archive</button>
                  </div>
                </div>
                <p className="text-sm mt-2 whitespace-pre-wrap">{m.message}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
