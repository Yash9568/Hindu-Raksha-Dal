"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function handleUploadIfAny() {
    if (!photoFile) return "";
    const fd = new FormData();
    fd.append("file", photoFile);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Upload failed");
    return data.url as string;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOk(null);
    try {
      const uploadedUrl = await handleUploadIfAny();
      const finalPhoto = uploadedUrl || photoUrl || "";
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password, photoUrl: finalPhoto }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to register");
      setOk("Account created. You can now login.");
    } catch (err: any) {
      setError(err?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-white rounded-lg shadow p-6 max-w-md">
      <h3 className="text-xl font-semibold mb-4">Register</h3>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          className="w-full border rounded px-3 py-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            className="w-full border rounded px-3 py-2 pr-10"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-600 hover:text-gray-800"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Upload Photo (optional)</label>
          <input
            type="file"
            accept="image/*"
            className="w-full border rounded px-3 py-2"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setPhotoFile(f);
            }}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {ok && <p className="text-sm text-green-600">{ok}</p>}
        <button
          disabled={loading}
          type="submit"
          className={`bg-[#FF9933] text-white px-4 py-2 rounded w-full inline-flex items-center justify-center gap-2 ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
          aria-busy={loading}
          aria-disabled={loading}
        >
          {loading && (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
          )}
          {loading ? "Please wait…" : "Create Account"}
        </button>
      </form>
      <p className="text-sm text-gray-600 mt-3">
        Already have an account? <a className="text-[#FF9933] hover:underline" href="/login">Login</a>
      </p>
    </section>
  );
}
