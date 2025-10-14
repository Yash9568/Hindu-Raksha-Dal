"use client";

import { useRef } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

type MembershipCardProps = {
  user: { name?: string; phone?: string; email?: string };
  membership: { memberId?: string; issuedAt?: string | Date };
};

export default function MembershipCard({ user, membership }: MembershipCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleGeneratePDF = async () => {
    if (!cardRef.current) return;
    // Ensure fonts/layout are fully ready to avoid blank canvases
    if ((document as any).fonts?.ready) {
      try { await (document as any).fonts.ready; } catch {}
    }
    // Double RAF to flush layout
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    const area = cardRef.current;
    const rect = area.getBoundingClientRect();
    const width = Math.max(1, Math.ceil(rect.width));
    const height = Math.max(1, Math.ceil(rect.height));
    const scale = Math.max(2, Math.min(3, (window.devicePixelRatio || 1) * 1.5));

    const canvas = await html2canvas(area, {
      scale,
      backgroundColor: "#ffffff",
      useCORS: true,
      allowTaint: true,
      width,
      height,
      foreignObjectRendering: true,
    });

    // If canvas somehow zero-sized, do a minimal retry without foreignObjectRendering
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      const retry = await html2canvas(area, {
        scale,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: true,
        width,
        height,
        foreignObjectRendering: false,
      });
      if (retry && retry.width && retry.height) {
        const img = retry.toDataURL("image/png");
        const pdf = new jsPDF({ orientation: retry.width >= retry.height ? "landscape" : "portrait", unit: "px", format: [retry.width, retry.height] });
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, retry.width, retry.height, "F");
        pdf.addImage(img, "PNG", 0, 0, retry.width, retry.height);
        pdf.save(`${membership.memberId || "membership-card"}.pdf`);
        return;
      }
    }

    const imgData = canvas.toDataURL("image/png");
    // Create a PDF sized exactly to the canvas to avoid scaling issues
    const pdf = new jsPDF({ orientation: canvas.width >= canvas.height ? "landscape" : "portrait", unit: "px", format: [canvas.width, canvas.height] });
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, canvas.width, canvas.height, "F");
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
    // Add outline for clear border in PDF
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(2);
    pdf.rect(0.5, 0.5, canvas.width - 1, canvas.height - 1);
    pdf.save(`${membership.memberId || "membership-card"}.pdf`);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Card Preview */}
      <div
        ref={cardRef}
        className="w-80 p-4 rounded-xl shadow-lg border bg-white"
      >
        <h2 className="text-xl font-bold text-center mb-2">
          Hindu Raksha Dal
        </h2>
        <div className="border p-3 rounded-lg text-sm">
          <p><b>Name:</b> {user?.name || "—"}</p>
          <p><b>Mobile:</b> {user?.phone || "—"}</p>
          <p><b>Email:</b> {user?.email || "—"}</p>
          <p><b>Member ID:</b> {membership?.memberId || "—"}</p>
          <p><b>Issued At:</b> {membership?.issuedAt ? new Date(membership.issuedAt).toLocaleDateString() : "—"}</p>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGeneratePDF}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700"
      >
        Generate & Download PDF
      </button>
    </div>
  );
}
