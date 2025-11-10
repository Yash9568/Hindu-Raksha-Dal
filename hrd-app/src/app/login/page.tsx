"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await signIn("credentials", {
        emailOrPhone,
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("Invalid credentials");
        return;
      }
      router.push("/");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="bg-white rounded-lg shadow p-6 max-w-md">
      <h3 className="text-xl font-semibold mb-4">Login</h3>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Email or Phone"
          value={emailOrPhone}
          onChange={(e) => setEmailOrPhone(e.target.value)}
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
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className={`bg-[#FF9933] text-white px-4 py-2 rounded w-full inline-flex items-center justify-center gap-2 ${submitting ? "opacity-70 cursor-not-allowed" : ""}`}
          aria-busy={submitting}
          aria-disabled={submitting}
        >
          {submitting && (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
          )}
          {submitting ? "Please wait…" : "Login"}
        </button>
      </form>
      <div className="text-sm text-right mt-2">
        <a className="text-[#FF9933] hover:underline" href="/forgot">Forgot password?</a>
      </div>
      <p className="text-sm text-gray-600 mt-3">
        New here? <a className="text-[#FF9933] hover:underline" href="/register">Create an account</a>
      </p>
    </section>
  );
}
