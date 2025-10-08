"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
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
        <input
          type="password"
          className="w-full border rounded px-3 py-2"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="bg-[#FF9933] text-white px-4 py-2 rounded w-full">Login</button>
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
