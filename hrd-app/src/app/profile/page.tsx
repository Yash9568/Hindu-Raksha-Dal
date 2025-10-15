"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgType, setMsgType] = useState<"success" | "error" | null>(null);
  const [pwOld, setPwOld] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [localPhotoPreview, setLocalPhotoPreview] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [issuedAt, setIssuedAt] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "edit" | "security">("overview");
  const [loadingProfile, setLoadingProfile] = useState(true);
  // Membership is read-only on profile page
  const [cacheBust, setCacheBust] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Selecting a photo only sets a local preview and defers saving to the Save button
  function selectPhoto(file: File) {
    try { setLocalPhotoPreview(URL.createObjectURL(file)); } catch {}
    setSelectedFile(file);
  }
  
  // No membership generation here; handled on /membership page
  
  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      setMsg("You are not logged in. Please login to view your profile.");
      setMsgType("error");
      router.push("/login");
      return;
    }
    // Seed UI from session immediately
    setName((session.user as any)?.name || "");
    setEmail((session.user as any)?.email || "");
    setPhotoUrl((session.user as any)?.image || "");
    // Fetch authoritative data from API (includes phone and membership)
    (async () => {
      setLoadingProfile(true);
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        if (res.ok) {
          const { user } = await res.json();
          setName(user?.name || "");
          setEmail(user?.email || "");
          setPhone(user?.phone || "");
          setPhotoUrl(user?.photoUrl || "");
          setCacheBust((n) => n + 1);
          setMemberId(user?.membership?.memberId || null);
          setIssuedAt(user?.membership?.issuedAt || null);
        } else {
          const d = await res.json().catch(() => ({}));
          setMsg(d?.error || "Could not load full profile");
          setMsgType("error");
        }
      } catch (e: any) {
        setMsg(e?.message || "Network error loading profile");
        setMsgType("error");
      } finally {
        setLoadingProfile(false);
      }
    })();
  }, [session, status, router]);

  useEffect(() => {
    // bump cache buster when photoUrl changes
    if (photoUrl) setCacheBust((n) => n + 1);
  }, [photoUrl]);

  // Ctrl+S to save
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function save() {
    setSaving(true);
    setMsg(null);
    setMsgType(null);
    // Basic validation
    if (!name.trim()) {
      setMsg("Name cannot be empty");
      setMsgType("error");
      setSaving(false);
      return false;
    }
    // If a new file is selected, resolve its URL now (Cloudinary if available, else embed)
    let photoUrlToSend = (photoUrl || "").trim();
    if (selectedFile) {
      setUploading(true);
      try {
        // 1) Try same-origin upload (public/uploads)
        try {
          const fdLocal = new FormData();
          fdLocal.append("file", selectedFile);
          const upLocal = await fetch("/api/upload", { method: "POST", body: fdLocal });
          if (upLocal.ok) {
            const j = await upLocal.json();
            if (j?.url) photoUrlToSend = j.url as string;
          } else {
            throw new Error("local-upload-failed");
          }
        } catch {
          // 2) Try Cloudinary
          let cfg: any = null;
          try {
            const r = await fetch("/api/cloudinary/sign");
            if (r.ok) cfg = await r.json();
          } catch {}
          if (cfg) {
            const fd = new FormData();
            fd.append("file", selectedFile);
            fd.append("api_key", cfg.apiKey);
            fd.append("timestamp", String(cfg.timestamp));
            fd.append("folder", cfg.folder);
            fd.append("signature", cfg.signature);
            const endpoint = `https://api.cloudinary.com/v1_1/${cfg.cloudName}/auto/upload`;
            const up = await fetch(endpoint, { method: "POST", body: fd });
            const data = await up.json();
            if (!up.ok) throw new Error(data?.error?.message || "Upload failed");
            photoUrlToSend = data.secure_url;
          } else {
            // 3) Embed as data URL
            const toDataUrl = (f: File) => new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(f);
            });
            photoUrlToSend = await toDataUrl(selectedFile);
          }
        }
      } catch (e: any) {
        setMsg(e?.message || "Photo processing failed");
        setMsgType("error");
      } finally {
        setUploading(false);
      }
    }

    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, photoUrl: photoUrlToSend, phone }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg("Profile updated");
      setMsgType("success");
      try {
        // Refresh NextAuth session so header and any session-bound UI reflect new photo/name
        await update?.();
      } catch {}
      // Force avatar refresh
      setCacheBust((n) => n + 1);
      setPhotoUrl(photoUrlToSend);
      setSelectedFile(null);
      setLocalPhotoPreview("");
      // Re-fetch authoritative profile to ensure UI matches DB immediately
      try {
        const fresh = await fetch("/api/me", { cache: "no-store" });
        if (fresh.ok) {
          const { user } = await fresh.json();
          setPhotoUrl(user?.photoUrl || photoUrlToSend);
          setName(user?.name || name);
          setEmail(user?.email || email);
          setPhone(user?.phone || phone);
          setMemberId(user?.membership?.memberId || null);
          setIssuedAt(user?.membership?.issuedAt || null);
          setCacheBust((n) => n + 1);
        }
      } catch {}
      setSaving(false);
      return true;
    } else {
      setMsg(data?.error || "Update failed");
      setMsgType("error");
      setSaving(false);
      return false;
    }
  }

  async function changePassword() {
    setPwMsg(null);
    if (!pwOld || !pwNew) {
      setPwMsg("Enter both current and new password");
      return;
    }
    try {
      const res = await fetch("/api/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword: pwOld, newPassword: pwNew }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to change password");
      setPwMsg("Password updated");
      setPwOld("");
      setPwNew("");
    } catch (e: any) {
      setPwMsg(e?.message || "Error");
    }
  }

  return (
    <section className="bg-white rounded-lg shadow p-6 max-w-xl">
      <h3 className="text-xl font-semibold mb-4">My Profile</h3>
      {msg && (
        <div
          className={`mb-4 text-sm px-3 py-2 rounded ${
            msgType === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {msg}
        </div>
      )}
      {/* Tabs */}
      <div className="mb-4 flex gap-2 text-sm">
        <button onClick={() => setTab("overview")} className={`px-3 py-1 rounded ${tab === "overview" ? "bg-[#FF9933] text-white" : "bg-gray-100"}`}>Overview</button>
        <button onClick={() => setTab("edit")} className={`px-3 py-1 rounded ${tab === "edit" ? "bg-[#FF9933] text-white" : "bg-gray-100"}`}>Edit</button>
        <button onClick={() => setTab("security")} className={`px-3 py-1 rounded ${tab === "security" ? "bg-[#FF9933] text-white" : "bg-gray-100"}`}>Security</button>
      </div>

      {/* Avatar and banner */}
      <div className="flex items-center gap-3 mb-4">
        {/* Avatar preview */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            localPhotoPreview ||
            (photoUrl
              ? (photoUrl.startsWith("data:")
                  ? photoUrl
                  : `${photoUrl}${photoUrl.includes("?") ? "&" : "?"}v=${cacheBust}`)
              : "https://via.placeholder.com/64x64?text=HRD")
          }
          alt="Avatar"
          className="w-16 h-16 rounded-full border object-cover"
          onError={(e) => {
            e.currentTarget.src = "https://via.placeholder.com/64x64?text=HRD";
          }}
        />
        <div className="text-sm text-gray-600">Preview</div>
      </div>

      {/* Skeleton while loading */}
      {loadingProfile ? (
        <div className="space-y-3">
          <div className="h-4 bg-gray-100 rounded animate-pulse" />
          <div className="h-10 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 bg-gray-100 rounded animate-pulse" />
          <div className="h-10 bg-gray-100 rounded animate-pulse" />
        </div>
      ) : tab === "overview" ? (
        <div className="grid gap-4">
          {/* Membership info */}
          <div>
            <div className="text-xs uppercase text-gray-500">Membership</div>
            {memberId ? (
              <div className="text-base font-medium">
                {memberId} {issuedAt && (
                  <span className="text-xs text-gray-500" suppressHydrationWarning>
                    (Issued {new Date(issuedAt).toISOString().slice(0, 10)})
                  </span>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-600">No membership assigned</div>
            )}
          </div>
          {/* Email */}
          <div>
            <div className="text-xs uppercase text-gray-500">Email</div>
            <div className="text-base font-medium break-all">{email || "—"}</div>
          </div>
          {/* Phone */}
          <div>
            <div className="text-xs uppercase text-gray-500">Phone</div>
            <div className="text-base font-medium">{phone || "—"}</div>
          </div>
        </div>
      ) : tab === "edit" ? (
        <div className="grid gap-4">
          {/* Membership section (read-only) */}
          <div>
            <div className="text-xs uppercase text-gray-500">Membership</div>
            {memberId ? (
              <div className="text-base font-medium">{memberId} {issuedAt && (
                <span className="text-xs text-gray-500" suppressHydrationWarning>
                  (Issued {new Date(issuedAt).toISOString().slice(0, 10)})
                </span>
              )}</div>
            ) : (
              <div className="text-sm text-gray-600">No membership assigned</div>
            )}
          </div>

          {/* Name */}
          <div>
            <div className="text-xs uppercase text-gray-500">Name</div>
            <div className="text-base font-medium">{name || "—"}</div>
            <button
              type="button"
              className="text-xs text-[#FF9933] underline mt-1"
              onClick={() => nameInputRef.current?.focus()}
            >
              Edit
            </button>
            <input
              className="mt-2 w-full border rounded px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Edit name"
              ref={nameInputRef}
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <div className="text-xs uppercase text-gray-500">Email</div>
            <div className="text-base font-medium">{email || "—"}</div>
            <input className="mt-2 w-full border rounded px-3 py-2 bg-gray-100" value={email} disabled />
          </div>

          {/* Phone */}
          <div>
            <div className="text-xs uppercase text-gray-500">Phone</div>
            <div className="text-base font-medium">{phone || "—"}</div>
            <button
              type="button"
              className="text-xs text-[#FF9933] underline mt-1"
              onClick={() => phoneInputRef.current?.focus()}
            >
              Edit
            </button>
            <input
              className="mt-2 w-full border rounded px-3 py-2"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Edit phone"
              ref={phoneInputRef}
            />
          </div>

          {/* Photo URL */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) selectPhoto(f);
            }}
          >
            <div className="text-xs uppercase text-gray-500">Photo URL</div>
            <div className="text-base break-all text-gray-700">{photoUrl || "—"}</div>
            <button
              type="button"
              className="text-xs text-[#FF9933] underline mt-1"
              onClick={() => photoInputRef.current?.focus()}
            >
              Edit
            </button>
            <input
              className="mt-2 w-full border rounded px-3 py-2"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="Paste image URL"
              ref={photoInputRef}
            />
            <div className="mt-2 flex items-center gap-3 w-full">
              <div className="w-full">
                <label className="block text-xs text-gray-600 mb-1">Choose photo</label>
                <input
                  type="file"
                  accept="image/*"
                  className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[#FF9933] file:text-white hover:file:bg-[#ff8a0d] border rounded px-3 py-2"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) selectPhoto(f);
                  }}
                />
              </div>
              {uploading && <span className="text-xs text-gray-600">Processing…</span>}
            </div>
            <div className={`mt-2 text-xs ${isDragging ? "text-[#FF9933]" : "text-gray-500"}`}>
              {isDragging ? "Drop image to select" : "Tip: drag & drop an image here to select"}
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <button disabled={saving} onClick={save} className="bg-[#FF9933] text-white px-4 py-2 rounded">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      ) : (
        // Security tab
        <div className="grid gap-3">
          <label className="text-sm text-gray-600">Current Password</label>
          <input
            type="password"
            className="w-full border rounded px-3 py-2"
            value={pwOld}
            onChange={(e) => setPwOld(e.target.value)}
          />
          <label className="text-sm text-gray-600">New Password</label>
          <input
            type="password"
            className="w-full border rounded px-3 py-2"
            value={pwNew}
            onChange={(e) => setPwNew(e.target.value)}
          />
          <div className="flex items-center gap-3 mt-2">
            <button onClick={changePassword} className="bg-[#FF9933] text-white px-4 py-2 rounded">
              Update Password
            </button>
            {pwMsg && <span className="text-sm text-gray-600">{pwMsg}</span>}
          </div>
          <div className="text-sm mt-2">
            <a className="text-[#FF9933] hover:underline" href="/forgot">Forgot password?</a>
          </div>
        </div>
      )}
    </section>
  );
}
