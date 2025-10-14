"use client";

import React from "react";

export default function MembershipPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Membership Card Generator</h1>
        <div className="w-full rounded-lg shadow bg-white overflow-hidden" style={{ height: "85vh" }}>
          <iframe
            src="/membership.html"
            title="Membership Card Generator"
            style={{ width: "100%", height: "100%", border: 0 }}
          />
        </div>
        <div className="text-sm text-gray-600 mt-3">
          If the preview does not load, open directly:
          <a href="/membership.html" className="text-blue-600 underline ml-1">/membership.html</a>
        </div>
      </div>
    </div>
  );
}
