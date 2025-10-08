"use client";

import { useEffect, useState } from "react";

type Post = {
  id: string;
  title: string;
  content: string;
  author?: { name?: string | null } | null;
  categories: { name: string }[];
};

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [tag, setTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Post[]>([]);
  const [ranOnce, setRanOnce] = useState(false);

  async function runSearch() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (tag) params.set("tag", tag.replace(/^#/, ""));
    const res = await fetch(`/api/posts?${params.toString()}`);
    const data = await res.json();
    setResults(data.posts || []);
    setLoading(false);
    setRanOnce(true);
  }

  useEffect(() => {
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-4">Search & Filter</h3>
      <div className="grid md:grid-cols-4 gap-4 mb-4">
        <input value={q} onChange={(e)=>setQ(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Keyword" />
        <input value={category} onChange={(e)=>setCategory(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Category (slug or name)" />
        <input value={tag} onChange={(e)=>setTag(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Tag (e.g. #Diwali)" />
        <button onClick={runSearch} className="bg-[#FF9933] text-white px-4 py-2 rounded">Search</button>
      </div>
      {loading ? (
        <p>Loading…</p>
      ) : results.length === 0 && ranOnce ? (
        <p className="text-sm text-gray-600">No results found.</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {results.map((p) => (
            <article key={p.id} className="border rounded p-3">
              <div className="text-xs text-gray-500 mb-1">by {p.author?.name || "Member"}</div>
              <div className="font-semibold">{p.title}</div>
              <p className="text-sm text-gray-600 line-clamp-3 mt-1">{p.content}</p>
              <div className="text-xs text-gray-400 mt-2">{p.categories.map((c)=>c.name).join(", ") || "General"}</div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
