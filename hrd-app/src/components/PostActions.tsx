"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

export default function PostActions({ postId, title }: { postId: string; title?: string }) {
  const { data: session } = useSession();
  const userKey = useMemo(() => (session?.user ? (session.user as any).id : "anon"), [session]);
  const storageKey = useMemo(() => `hrd_like_${postId}_${userKey}`, [postId, userKey]);

  const [likes, setLikes] = useState<number>(0);
  const [liked, setLiked] = useState<boolean>(false);
  const [comments, setComments] = useState<Array<{ id: string; text: string }>>([]);
  const [text, setText] = useState("");
  const [copyMsg, setCopyMsg] = useState<string>("");

  useEffect(() => {
    try {
      const val = localStorage.getItem(storageKey);
      if (val === "1") setLiked(true);
    } catch {}
  }, [storageKey]);

  async function onShare() {
    try {
      const url = `${window.location.origin}${window.location.pathname}#post-${postId}`;
      await navigator.clipboard.writeText(url);
      setCopyMsg("Link copied");
      setTimeout(() => setCopyMsg(""), 1500);
    } catch {
      setCopyMsg("Copy failed");
      setTimeout(() => setCopyMsg(""), 1500);
    }
  }

  function onLike() {
    if (liked) return; // only once per user/device
    setLiked(true);
    setLikes((n) => n + 1);
    try { localStorage.setItem(storageKey, "1"); } catch {}
  }

  function onAddComment(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setComments((arr) => [{ id: String(Date.now()), text: t }, ...arr]);
    setText("");
  }

  return (
    <div className="px-3 pb-3">
      <div className="flex items-center gap-3 text-sm">
        <button onClick={onLike} disabled={liked} className={`px-3 py-1 rounded border ${liked ? "bg-gray-100 cursor-not-allowed" : "hover:bg-gray-50"}`}>
          {liked ? "👍 Liked" : "👍 Like"} {likes ? `(${likes})` : ""}
        </button>
        <button onClick={onShare} className="px-3 py-1 rounded border hover:bg-gray-50">🔗 Share</button>
        {copyMsg && <span className="text-xs text-gray-500">{copyMsg}</span>}
      </div>
      <form onSubmit={onAddComment} className="mt-2 flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 border rounded px-3 py-2 text-sm"
        />
        <button className="px-3 py-2 text-sm bg-[#FF9933] text-white rounded">Comment</button>
      </form>
      {comments.length > 0 && (
        <ul className="mt-2 space-y-2">
          {comments.map((c) => (
            <li key={c.id} className="text-sm bg-gray-50 border rounded px-3 py-2">{c.text}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
