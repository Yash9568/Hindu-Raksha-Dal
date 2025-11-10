"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function PostsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"text" | "image" | "video">("text");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [categories, setCategories] = useState("");
  const [tags, setTags] = useState("");

  const imageUrl = useMemo(() => (imageFile ? URL.createObjectURL(imageFile) : ""), [imageFile]);
  const videoUrl = useMemo(() => (videoFile ? URL.createObjectURL(videoFile) : ""), [videoFile]);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submitDemo(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSubmitting(true);
      setMsg(null);
      setErr(null);
      // 1) Prepare media uploads (optional)
      const mediaUrls: string[] = [];
      if (imageFile || videoFile) {
        let cloudCfg: any = null;
        async function uploadLocal(file: File) {
          const fd = new FormData();
          fd.append("file", file);
          const res = await fetch("/api/upload", { method: "POST", body: fd });
          if (!res.ok) throw new Error("local-upload-failed");
          const j = await res.json();
          return j.url as string;
        }
        async function ensureCloudCfg() {
          if (cloudCfg) return cloudCfg;
          try {
            const sigRes = await fetch("/api/cloudinary/sign");
            if (sigRes.ok) cloudCfg = await sigRes.json();
          } catch {}
          return cloudCfg;
        }
        async function uploadCloud(file: File) {
          const cfg = await ensureCloudCfg();
          if (!cfg) throw new Error("no-cloudinary");
          const { cloudName, apiKey, timestamp, folder, signature } = cfg;
          const fd = new FormData();
          fd.append("file", file);
          fd.append("api_key", apiKey);
          fd.append("timestamp", String(timestamp));
          fd.append("folder", folder);
          fd.append("signature", signature);
          const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
          const up = await fetch(endpoint, { method: "POST", body: fd });
          const data = await up.json();
          if (!up.ok) throw new Error(data?.error?.message || "Upload failed");
          return data.secure_url as string;
        }

        async function uploadWithFallback(file: File) {
          try {
            return await uploadLocal(file);
          } catch {
            try {
              return await uploadCloud(file);
            } catch {
              return ""; // give up silently, keep post text-only
            }
          }
        }

        if (imageFile) {
          const url = await uploadWithFallback(imageFile);
          if (url) mediaUrls.push(url);
        }
        if (videoFile) {
          const url = await uploadWithFallback(videoFile);
          if (url) mediaUrls.push(url);
        }
      }

      // 2) Persist post
      const effectiveType = (videoFile ? "VIDEO" : (imageFile ? "IMAGE" : type.toUpperCase())) as "TEXT"|"IMAGE"|"VIDEO";
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          type: effectiveType,
          categories,
          tags,
          media: mediaUrls.length ? mediaUrls : null,
        }),
      });
      if (res.status === 401) {
        setErr("Please login to create a post.");
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to submit post");
      setMsg("Post submitted for approval.");
      // Reset form
      setTitle("");
      setType("text");
      setContent("");
      setImageFile(null);
      setVideoFile(null);
      setCategories("");
      setTags("");
    } catch (err: any) {
      setErr(err?.message || "Error submitting post");
    }
    setSubmitting(false);
  }

  return (
    <section className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-4">Create a Post</h3>
      {status !== "loading" && !session?.user ? (
        <div className="text-sm text-gray-700">
          Please <a href="/login" className="text-[#FF9933] underline">login</a> to create a post.
        </div>
      ) : (
      <form onSubmit={submitDemo} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Title</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Type</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={type}
              onChange={(e) => setType(e.target.value as any)}
            >
              <option value="text">Text</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Content</label>
          <textarea
            className="w-full border rounded px-3 py-2 min-h-[120px]"
            placeholder="Write your content (for text posts)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Upload Image</label>
            <input
              type="file"
              accept="image/*"
              className="w-full border rounded px-3 py-2"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setImageFile(f);
                if (f) setType("image");
              }}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Upload Video</label>
            <input
              type="file"
              accept="video/*"
              className="w-full border rounded px-3 py-2"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setVideoFile(f);
                if (f) setType("video");
              }}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Categories (comma separated)</label>
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="Festivals, History"
              value={categories}
              onChange={(e) => setCategories(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Tags (comma separated)</label>
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="#Diwali, #Culture"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            disabled={submitting}
            className={`bg-[#FF9933] text-white px-4 py-2 rounded inline-flex items-center gap-2 ${submitting ? "opacity-70 cursor-not-allowed" : ""}`}
            type="submit"
            aria-busy={submitting}
            aria-disabled={submitting}
          >
            {submitting && (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            )}
            {submitting ? "Publishing…" : "Publish"}
          </button>
          {msg && <span className="text-sm text-green-700">{msg}</span>}
          {err && <span className="text-sm text-red-600">{err}</span>}
        </div>
      </form>
      )}
      <div className="mt-6">
        <h4 className="font-semibold mb-2">Preview</h4>
        <div className="border rounded p-3 text-sm text-gray-600">
          <div className="text-base font-semibold mb-1">{title || "Untitled"}</div>
          {type === "text" && <p className="mb-2 whitespace-pre-wrap">{content || "—"}</p>}
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="upload" className="w-full rounded mb-2" />
          )}
          {videoUrl && (
            <video src={videoUrl} className="w-full rounded mb-2" controls />
          )}
          <div className="text-xs text-gray-500">
            Categories: {categories || "—"} | Tags: {tags || "—"}
          </div>
        </div>
      </div>
    </section>
  );
}
