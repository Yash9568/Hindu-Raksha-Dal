import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // In production, writing to the local filesystem is not supported by most hosts
    // and files under /public/uploads won't be served. Force clients to use Cloudinary.
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Local upload is disabled in production. Use Cloudinary." },
        { status: 400 }
      );
    }
    const form = await req.formData();
    const file = form.get("file") as unknown as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const ext = (file.name?.split(".").pop() || "bin").toLowerCase();
    const base = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const filename = `${base}.${ext}`;
    const target = path.join(uploadsDir, filename);

    await fs.writeFile(target, buffer);

    const url = `/uploads/${filename}`;
    return NextResponse.json({ url }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Upload error" }, { status: 500 });
  }
}
