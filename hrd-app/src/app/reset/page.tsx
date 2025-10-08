"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function ResetPasswordPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null); setErr(null);
    if (!token) { setErr("Invalid or missing token"); return; }
    if (!password || password !== confirm) { setErr("Passwords do not match"); return; }
    try {
      setLoading(true);
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Reset failed");
      setMsg("Password updated. You can login now.");
      setTimeout(()=> router.push("/login"), 1200);
    } catch (e: any) {
      setErr(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-white rounded-lg shadow p-6 max-w-md mx-auto">
      <h3 className="text-xl font-semibold mb-4">Reset Password</h3>
      {msg && <div className="mb-3 text-sm bg-green-50 text-green-700 px-3 py-2 rounded">{msg}</div>}
      {err && <div className="mb-3 text-sm bg-red-50 text-red-700 px-3 py-2 rounded">{err}</div>}
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-sm text-gray-700 mb-1">New Password</label>
          <input type="password" className="w-full border rounded px-3 py-2" value={password} onChange={(e)=>setPassword(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Confirm Password</label>
          <input type="password" className="w-full border rounded px-3 py-2" value={confirm} onChange={(e)=>setConfirm(e.target.value)} required />
        </div>
        <button disabled={loading} className="bg-[#FF9933] text-white px-4 py-2 rounded" type="submit">
          {loading ? "Updating…" : "Update Password"}
        </button>
      </form>
    </section>
  );
}
