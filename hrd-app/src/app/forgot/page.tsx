"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null); setErr(null); setResetUrl(null);
    try {
      setLoading(true);
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Request failed");
      setMsg(data?.message || "If the account exists, a reset link has been created.");
      if (data?.resetUrl) setResetUrl(data.resetUrl);
    } catch (e: any) {
      setErr(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-white rounded-lg shadow p-6 max-w-md mx-auto">
      <h3 className="text-xl font-semibold mb-4">Forgot Password</h3>
      {msg && <div className="mb-3 text-sm bg-green-50 text-green-700 px-3 py-2 rounded">{msg}</div>}
      {err && <div className="mb-3 text-sm bg-red-50 text-red-700 px-3 py-2 rounded">{err}</div>}
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Email</label>
          <input type="email" className="w-full border rounded px-3 py-2" value={email} onChange={(e)=>setEmail(e.target.value)} required />
        </div>
        <button disabled={loading} className="bg-[#FF9933] text-white px-4 py-2 rounded" type="submit">
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
      {resetUrl && (
        <div className="mt-4 text-xs text-gray-600 break-all">
          Dev only: Reset URL — <a className="text-[#FF9933] underline" href={resetUrl}>{resetUrl}</a>
        </div>
      )}
    </section>
  );
}
