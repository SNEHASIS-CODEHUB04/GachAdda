import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (!file.type.startsWith("image/"))
      return NextResponse.json({ error: "Only images allowed" }, { status: 400 });
    if (file.size > 5 * 1024 * 1024)
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });

    // Vercel: use Vercel Blob if token is set
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = await import("@vercel/blob");
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const filename = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const blob = await put(filename, file, { access: "public" });
      return NextResponse.json({ url: blob.url });
    }

    // Local dev: write to public/uploads
    const { writeFile, mkdir } = await import("fs/promises");
    const { join } = await import("path");
    const bytes = await file.arrayBuffer();
    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    await writeFile(join(uploadDir, filename), Buffer.from(bytes));
    return NextResponse.json({ url: `/uploads/${filename}` });

  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
