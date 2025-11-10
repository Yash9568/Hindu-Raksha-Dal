"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function DeletePostButton({ postId, authorId, className }: { postId: string; authorId?: string | null; className?: string; }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const uid = session?.user?.id;
  const role = session?.user?.role;
  const canDelete = !!uid && (uid === authorId || role === "ADMIN");

  if (!canDelete) return null;

  async function onDelete() {
    if (!postId) return;
    const ok = typeof window === "undefined" ? true : window.confirm("Delete this post?");
    if (!ok) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j?.error || "Delete failed");
        return;
      }
      // Refresh the list
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={onDelete} disabled={loading} className={className || "ml-auto px-3 py-1 rounded border text-red-700 hover:bg-red-50 disabled:opacity-60"}>
      {loading ? "Deleting..." : "Delete"}
    </button>
  );
}
