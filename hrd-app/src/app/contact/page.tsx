"use client";

import { useState } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<null | { type: "success" | "error"; text: string }>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    if (!name.trim() || !message.trim()) {
      setStatus({ type: "error", text: "Name and message are required" });
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, subject, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to send");
      setStatus({ type: "success", text: "Message sent. We will contact you soon." });
      setName(""); setEmail(""); setPhone(""); setSubject(""); setMessage("");
    } catch (err: any) {
      setStatus({ type: "error", text: err?.message || "Failed to send" });
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
      <h3 className="text-xl font-semibold mb-4">Contact Us</h3>
      {status && (
        <div className={`mb-4 px-3 py-2 rounded ${status.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {status.text}
        </div>
      )}
      <form onSubmit={submit} className="grid gap-4">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Name *</label>
          <input className="w-full border rounded px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Email</label>
            <input type="email" className="w-full border rounded px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Phone</label>
            <input className="w-full border rounded px-3 py-2" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Subject</label>
          <input className="w-full border rounded px-3 py-2" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Message *</label>
          <textarea className="w-full border rounded px-3 py-2 h-32" value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
        <div>
          <button disabled={sending} className="bg-[#FF9933] text-white px-4 py-2 rounded">
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </form>
    </section>
  );
}
