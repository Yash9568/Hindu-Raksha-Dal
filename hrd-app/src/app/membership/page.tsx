"use client";

import { useEffect, useRef, useState } from "react";

function zeroPad(n: number, len = 5) {
  return String(n).padStart(len, "0");
}

function generateMemberId() {
  // Use a deterministic placeholder here; backend API should generate real one
  const now = new Date();
  const year = now.getUTCFullYear();
  const seq = Number(String(now.getTime()).slice(-5));
  return `HRD-${year}-${zeroPad(seq)}`;
}

export default function MembershipPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [dob, setDob] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [memberId, setMemberId] = useState<string>("HRD-YYYY-00000");
  const [exporting, setExporting] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [issued, setIssued] = useState<string>("");
  const [validTill, setValidTill] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"orange" | "blue" | "dark">("orange");
  const [copied, setCopied] = useState<string>("");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const cardRef = useRef<HTMLDivElement>(null);
  const photoElRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Compute on client to avoid SSR/CSR locale mismatch
    const d = new Date();
    // ISO-like stable format yyyy-mm-dd
    setIssued(d.toISOString().slice(0, 10));
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!issued) return;
    try {
      const d = new Date(issued);
      d.setFullYear(d.getFullYear() + 1);
      setValidTill(d.toISOString().slice(0, 10));
    } catch {}
  }, [issued]);

  // Generate QR image from memberId via proxy to avoid CORS taint
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!memberId) { setQrDataUrl(""); return; }
        const base = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(memberId)}`;
        const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(base)}`;
        const resp = await fetch(proxyUrl, { cache: "no-store" });
        if (!resp.ok) { setQrDataUrl(""); return; }
        const blob = await resp.blob();
        const reader = new FileReader();
        const dataUrl: string = await new Promise((res, rej) => {
          reader.onload = () => res(reader.result as string);
          reader.onerror = rej;
          reader.readAsDataURL(blob);
        });
        if (alive) setQrDataUrl(dataUrl);
      } catch {
        if (alive) setQrDataUrl("");
      }
    })();
    return () => { alive = false; };
  }, [memberId]);

  async function assignToMyAccount() {
    setBanner(null);
    setAssigning(true);
    try {
      const res = await fetch("/api/me/membership", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to assign membership");
      setMemberId(data.membership.memberId);
      if (data.membership.issuedAt) setIssued(new Date(data.membership.issuedAt).toISOString().slice(0, 10));
      setBanner({ type: "success", text: "Membership assigned to your account." });
    } catch (e: any) {
      setBanner({ type: "error", text: e?.message || "Could not assign membership. Please login and try again." });
    } finally {
      setAssigning(false);
    }
    
  }
  
  async function handlePrint() {
    try {
      if (!cardRef.current) return;
      const html2canvas = (await import("html2canvas")).default;
      setExporting(true);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const overlay = cardRef.current.querySelector(".card-gradient") as HTMLElement | null;
      const prev = overlay?.style.display ?? "";
      if (overlay) overlay.style.display = "none";
      const el = cardRef.current;
      const canvas = await html2canvas(el, {
        scale: 3,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: true,
        width: el?.offsetWidth || 340,
        height: el?.offsetHeight || 210,
        scrollX: 0,
        scrollY: 0,
        onclone: (doc: Document) => {
          const style = doc.createElement('style');
          style.textContent = `html, body, *, *::before, *::after { background: transparent !important; background-image: none !important; box-shadow: none !important; }
          #cardArea, #cardArea * { color: #111827 !important; }`;
          doc.head.appendChild(style);
          const ov = doc.querySelector("#cardArea .card-gradient") as HTMLElement | null;
          if (ov) ov.style.display = "none";
        },
      } as any);
      if (overlay) overlay.style.display = prev;
      const dataUrl = canvas.toDataURL('image/png');
      const w = window.open('', 'printWindow');
      if (!w) { alert('Popup blocked. Allow popups to print.'); setExporting(false); return; }
      const html = `<!DOCTYPE html><html><head><title>Print Card</title>
        <style>
          html,body{margin:0;padding:0}
          @page{size: auto;margin: 10mm}
          .wrap{display:flex;align-items:center;justify-content:center;width:100vw;height:100vh}
          img{max-width:100%;height:auto}
        </style>
      </head><body>
        <div class="wrap"><img src="${dataUrl}" alt="Membership Card"/></div>
        <script>window.addEventListener('load',()=>{setTimeout(()=>{window.print();},50)});</script>
      </body></html>`;
      w.document.open();
      w.document.write(html);
      w.document.close();
    } catch (e) {
      console.error('Print failed', e);
      alert('Print failed. Please try PDF/PNG export.');
    }
    setExporting(false);
  }

  async function handleDownloadPNG() {
    try {
      if (!cardRef.current) return;
      const html2canvas = (await import("html2canvas")).default;
      setExporting(true);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      // Hide gradient overlay (can contain unsupported color spaces)
      const overlay = cardRef.current.querySelector(".card-gradient") as HTMLElement | null;
      const prev = overlay?.style.display ?? "";
      if (overlay) overlay.style.display = "none";

      // If using a remote image, convert to data URL to avoid CORS taint
      let restoreSrc: string | null = null;
      if (photoElRef.current && photoUrl && /^https?:/i.test(photoUrl)) {
        try {
          restoreSrc = photoElRef.current.src;
          const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(photoUrl)}`;
          const resp = await fetch(proxyUrl, { cache: "no-store" });
          const blob = await resp.blob();
          const reader = new FileReader();
          const dataUrl: string = await new Promise((res, rej) => {
            reader.onload = () => res(reader.result as string);
            reader.onerror = rej;
            reader.readAsDataURL(blob);
          });
          photoElRef.current.src = dataUrl;
          await new Promise((res) => {
            photoElRef.current?.addEventListener("load", res, { once: true });
          });
        } catch {}
      }
      const el = cardRef.current;
      const canvas = await html2canvas(el, {
        scale: 3,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: true,
        imageTimeout: 15000,
        foreignObjectRendering: true,
        width: el?.offsetWidth || 340,
        height: el?.offsetHeight || 210,
        scrollX: 0,
        scrollY: 0,
        onclone: (doc: Document) => {
          // Strip any gradients, modern color functions, and pseudo-element backgrounds globally
          const style = doc.createElement('style');
          style.textContent = `html, body, *, *::before, *::after { background: transparent !important; background-image: none !important; box-shadow: none !important; }
          #cardArea, #cardArea * { color: #111827 !important; }`;
          doc.head.appendChild(style);
          const ov = doc.querySelector("#cardArea .card-gradient") as HTMLElement | null;
          if (ov) ov.style.display = "none";
        },
      } as any);
      if (overlay) overlay.style.display = prev;
      if (restoreSrc && photoElRef.current) photoElRef.current.src = restoreSrc;
      const link = document.createElement("a");
      link.download = `${memberId}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.error("PNG export attempt 1 failed", e);
      // Retry without photo if present
      try {
        const imgEl = photoElRef.current as HTMLElement | null;
        const prevDisp = imgEl?.style.display ?? "";
        if (imgEl) imgEl.style.display = "none";
        const html2canvas = (await import("html2canvas")).default;
        const el2 = cardRef.current!;
        const canvas = await html2canvas(el2, {
          scale: 3,
          backgroundColor: "#ffffff",
          useCORS: true,
          allowTaint: true,
          imageTimeout: 15000,
          foreignObjectRendering: true,
          width: el2?.offsetWidth || 340,
          height: el2?.offsetHeight || 210,
          scrollX: 0,
          scrollY: 0,
          onclone: (doc: Document) => {
            const style = doc.createElement('style');
            style.textContent = `html, body, *, *::before, *::after { background: transparent !important; background-image: none !important; box-shadow: none !important; }
            #cardArea, #cardArea * { color: #111827 !important; }`;
            doc.head.appendChild(style);
            const ov = doc.querySelector("#cardArea .card-gradient") as HTMLElement | null;
            if (ov) ov.style.display = "none";
          },
        } as any);
        if (imgEl) imgEl.style.display = prevDisp;
        const link = document.createElement("a");
        link.download = `${memberId}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      } catch (e2) {
        console.error("PNG export attempt 2 (no photo) failed", e2);
        alert("Could not generate PNG. Try removing the photo or using a different image.");
      }
    }
    setExporting(false);
  }

  async function handleDownloadPDF() {
    try {
      if (!cardRef.current) return;
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      setExporting(true);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const overlay = cardRef.current.querySelector(".card-gradient") as HTMLElement | null;
      const prev = overlay?.style.display ?? "";
      if (overlay) overlay.style.display = "none";
      let restoreSrc: string | null = null;
      if (photoElRef.current && photoUrl && /^https?:/i.test(photoUrl)) {
        try {
          restoreSrc = photoElRef.current.src;
          const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(photoUrl)}`;
          const resp = await fetch(proxyUrl, { cache: "no-store" });
          const blob = await resp.blob();
          const reader = new FileReader();
          const dataUrl: string = await new Promise((res, rej) => {
            reader.onload = () => res(reader.result as string);
            reader.onerror = rej;
            reader.readAsDataURL(blob);
          });
          photoElRef.current.src = dataUrl;
          await new Promise((res) => {
            photoElRef.current?.addEventListener("load", res, { once: true });
          });
        } catch {}
      }
      const el3 = cardRef.current;
      const canvas = await html2canvas(el3, {
        scale: 3,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: true,
        imageTimeout: 15000,
        foreignObjectRendering: true,
        width: el3?.offsetWidth || 340,
        height: el3?.offsetHeight || 210,
        scrollX: 0,
        scrollY: 0,
        onclone: (doc: Document) => {
          const style = doc.createElement('style');
          style.textContent = `html, body, *, *::before, *::after { background: transparent !important; background-image: none !important; box-shadow: none !important; }
          #cardArea, #cardArea * { color: #111827 !important; }`;
          doc.head.appendChild(style);
          const ov = doc.querySelector('#cardArea .card-gradient') as HTMLElement | null;
          if (ov) ov.style.display = 'none';
        },
      } as any);
      if (overlay) overlay.style.display = prev;
      if (restoreSrc && photoElRef.current) photoElRef.current.src = restoreSrc;
      const imgData = canvas.toDataURL("image/png");
      // Convert px -> pt (assuming 96 dpi: 72pt = 96px => 1px = 0.75pt)
      const pxToPt = 0.75;
      const pdfWpt = canvas.width * pxToPt;
      const pdfHpt = canvas.height * pxToPt;
      const pdf = new jsPDF({ orientation: pdfWpt >= pdfHpt ? "landscape" : "portrait", unit: "pt", format: [pdfWpt, pdfHpt] });
      // Fill white background explicitly
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), "F");
      pdf.addImage(imgData, "PNG", 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
      pdf.save(`${memberId}.pdf`);
    } catch (e) {
      console.error("PDF export attempt 1 failed", e);
      // Retry using canvas renderer (no foreignObjectRendering)
      try {
        const elX = cardRef.current!;
        const html2canvas = (await import("html2canvas")).default;
        const canvas = await html2canvas(elX, {
          scale: 3,
          backgroundColor: "#ffffff",
          useCORS: true,
          allowTaint: true,
          imageTimeout: 15000,
          foreignObjectRendering: false,
          width: elX?.offsetWidth || 340,
          height: elX?.offsetHeight || 210,
          scrollX: 0,
          scrollY: 0,
          onclone: (doc: Document) => {
            const style = doc.createElement('style');
            style.textContent = `#cardArea { background: #ffffff !important; } #cardArea, #cardArea * { color: #111827 !important; }`;
            doc.head.appendChild(style);
          },
        } as any);
        const imgData = canvas.toDataURL("image/png");
        const { jsPDF } = await import("jspdf");
        const pxToPt = 0.75;
        const pdfWpt = canvas.width * pxToPt;
        const pdfHpt = canvas.height * pxToPt;
        const pdf = new jsPDF({ orientation: pdfWpt >= pdfHpt ? "landscape" : "portrait", unit: "pt", format: [pdfWpt, pdfHpt] });
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), "F");
        pdf.addImage(imgData, "PNG", 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
        pdf.save(`${memberId}.pdf`);
        setExporting(false);
        return;
      } catch (eMid) {
        console.error("PDF export attempt 2 (canvas renderer) failed", eMid);
      }
      // Retry without photo if present
      try {
        const imgEl = photoElRef.current as HTMLElement | null;
        const prevDisp = imgEl?.style.display ?? "";
        if (imgEl) imgEl.style.display = "none";
        const html2canvas = (await import("html2canvas")).default;
        const canvas = await html2canvas(cardRef.current!, {
          scale: 3,
          backgroundColor: "#ffffff",
          useCORS: true,
          allowTaint: true,
          imageTimeout: 15000,
          foreignObjectRendering: true,
          onclone: (doc: Document) => {
            const ov = doc.querySelector("#cardArea .card-gradient") as HTMLElement | null;
            if (ov) ov.style.display = "none";
          },
        } as any);
        if (imgEl) imgEl.style.display = prevDisp;
        const imgData = canvas.toDataURL("image/png");
        const { jsPDF } = await import("jspdf");
        const pxToPt = 0.75;
        const pdfWpt = canvas.width * pxToPt;
        const pdfHpt = canvas.height * pxToPt;
        const pdf = new jsPDF({ orientation: pdfWpt >= pdfHpt ? "landscape" : "portrait", unit: "pt", format: [pdfWpt, pdfHpt] });
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), "F");
        pdf.addImage(imgData, "PNG", 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
        pdf.save(`${memberId}.pdf`);
      } catch (e2) {
        console.error("PDF export attempt 2 (no photo) failed", e2);
        alert("Could not generate PDF. Try removing the photo or using a different image.");
      }
    }
    setExporting(false);
  }

  async function handleGenerateId() {
    try {
      const res = await fetch("/api/membership/generate", { method: "POST", cache: "no-store" });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data && data.memberId) {
          setMemberId(data.memberId);
          return;
        }
      }
      // Fallback to client-side generator
      setMemberId(generateMemberId());
    } catch {
      setMemberId(generateMemberId());
    }
  }

  return (
    <section className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-4">Membership Card Generator</h3>

      {banner && (
        <div className={`mb-3 px-3 py-2 rounded ${banner.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{banner.text}</div>
      )}
      <form className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Full Name</label>
          <input className="w-full border rounded px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
          {!name && <div className="text-xs text-red-600 mt-1">Required</div>}
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Email</label>
          <input type="email" className="w-full border rounded px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Phone</label>
          <input className="w-full border rounded px-3 py-2" value={phone} onChange={(e) => setPhone(e.target.value)} />
          {!phone && <div className="text-xs text-red-600 mt-1">Required</div>}
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Address</label>
          <input className="w-full border rounded px-3 py-2" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Date of Birth</label>
          <input type="date" className="w-full border rounded px-3 py-2" value={dob} onChange={(e) => setDob(e.target.value)} />
          {!dob && <div className="text-xs text-red-600 mt-1">Required</div>}
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Theme</label>
          <select className="w-full border rounded px-3 py-2" value={theme} onChange={(e) => setTheme(e.target.value as any)}>
            <option value="orange">Orange</option>
            <option value="blue">Blue</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Photo</label>
          <input
            type="file"
            accept="image/*"
            className="w-full border rounded px-3 py-2"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setPhotoUrl(URL.createObjectURL(f));
            }}
          />
        </div>
        <div className="md:col-span-2 flex gap-3 flex-wrap">
          <button type="button" className="bg-[#FF9933] text-white px-4 py-2 rounded" onClick={handleGenerateId}>
            Generate Member ID
          </button>
          <button type="button" className="border border-[#FF9933] text-[#FF9933] px-4 py-2 rounded" onClick={handleDownloadPNG} disabled={exporting}>
            {exporting ? "Generating PNG…" : "Download PNG"}
          </button>
          <button type="button" className="border border-[#FF9933] text-[#FF9933] px-4 py-2 rounded" onClick={handleDownloadPDF} disabled={exporting}>
            {exporting ? "Generating PDF…" : "Download PDF"}
          </button>
          <button type="button" className="border border-gray-400 text-gray-700 px-4 py-2 rounded" onClick={handlePrint}>
            Print
          </button>
          <button
            type="button"
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded"
            onClick={async ()=>{ try { await navigator.clipboard.writeText(memberId); setCopied("ID copied"); setTimeout(()=>setCopied(""),1500);} catch { setCopied("Copy failed"); setTimeout(()=>setCopied(""),1500);} }}
          >
            Copy ID
          </button>
          {copied && <span className="text-xs text-gray-500 self-center">{copied}</span>}
          <button type="button" disabled={assigning} className="bg-green-600 text-white px-4 py-2 rounded" onClick={assignToMyAccount}>
            {assigning ? "Assigning…" : "Assign to my account"}
          </button>
        </div>
      </form>

      <div className="mt-6">
        <h4 className="font-semibold mb-2">Preview</h4>
        <div
          id="cardArea"
          ref={cardRef}
          className="w-[340px] h-[210px] bg-white border rounded relative overflow-hidden"
          style={{
            width: 340,
            height: 210,
            backgroundColor: '#ffffff',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
          }}
        >
          <div className="p-3 relative z-10 h-full flex gap-3">
            <div className="w-24 h-24 bg-gray-100 border rounded overflow-hidden relative">
              {photoUrl ? (
                <img ref={photoElRef} src={photoUrl} alt="Photo" className="w-full h-full object-cover" crossOrigin="anonymous" referrerPolicy="no-referrer" />
              ) : null}
            </div>
            <div className="flex-1 text-xs relative">
              <div className="flex items-center justify-between">
                <div className="font-bold" style={{ color: theme === 'orange' ? '#FF9933' : theme === 'blue' ? '#2563eb' : '#111827' }}>Hindu Raksha Dal</div>
                <div className="text-[10px]">Member ID</div>
              </div>
              <div className="text-sm font-semibold mt-1">{memberId}</div>
              {qrDataUrl && (
                <div className="absolute top-3 right-3 w-14 h-14 bg-white border rounded flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt="QR" className="w-12 h-12 object-contain" />
                </div>
              )}
              <div className="mt-2 space-y-1">
                <div>
                  <span className="font-semibold">Name:</span> {name || "—"}
                </div>
                <div>
                  <span className="font-semibold">Email:</span> {email || "—"}
                </div>
                <div>
                  <span className="font-semibold">Phone:</span> {phone || "—"}
                </div>
                <div>
                  <span className="font-semibold">DOB:</span> {dob || "—"}
                </div>
                <div>
                  <span className="font-semibold">Address:</span> {address || "—"}
                </div>
              </div>
              <div className="absolute bottom-2 left-0 text-[10px] text-gray-500 space-y-0.5" suppressHydrationWarning>
                <div>Issued: {mounted ? (issued || "") : ""}</div>
                <div>Valid Till: {mounted ? (validTill || "") : ""}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}