"use client";

export default function MembershipError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded">
      <h2 className="font-semibold mb-1">Membership page failed to render</h2>
      <p className="text-sm break-all mb-3">{error?.message || "Unknown error"}</p>
      <button onClick={() => reset()} className="bg-red-600 text-white px-3 py-1 rounded">Reload</button>
    </div>
  );
}
