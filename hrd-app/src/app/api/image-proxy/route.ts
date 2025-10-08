import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");
    if (!url || !/^https?:\/\//i.test(url)) {
      return NextResponse.json({ error: "Invalid url" }, { status: 400 });
    }
    const upstream = await fetch(url, { cache: "no-store" });
    if (!upstream.ok) {
      return NextResponse.json({ error: `Upstream failed: ${upstream.status}` }, { status: 502 });
    }
    const contentType = upstream.headers.get("content-type") || "application/octet-stream";
    const arrayBuf = await upstream.arrayBuffer();
    return new NextResponse(arrayBuf, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": "no-store",
        // Allow canvas usage from this same-origin endpoint
        "access-control-allow-origin": "*",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Proxy error" }, { status: 500 });
  }
}
