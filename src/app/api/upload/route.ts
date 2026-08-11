import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth";
import {
  CloudinaryConfigurationError,
  uploadBuffer,
} from "@/lib/cloudinary";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_BYTES = 8 * 1024 * 1024; // 8MB

export async function POST(request: Request) {
  const { error } = await requireApiSession();
  if (error) return error;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Only JPG, PNG, WEBP, and GIF images are allowed." },
        { status: 400 },
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Image must be 8MB or smaller." },
        { status: 400 },
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const { url, publicId } = await uploadBuffer(bytes);

    return NextResponse.json({
      url,
      filename: publicId,
    });
  } catch (err) {
    console.error(err);
    if (err instanceof CloudinaryConfigurationError) {
      return NextResponse.json(
        {
          error: `Image storage is not configured. Add ${err.missingVariables.join(", ")} in Vercel and redeploy.`,
          code: "CLOUDINARY_NOT_CONFIGURED",
        },
        { status: 503 },
      );
    }
    return NextResponse.json(
      {
        error: "Cloudinary rejected the upload. Check the Vercel runtime log.",
        code: "CLOUDINARY_UPLOAD_FAILED",
      },
      { status: 502 },
    );
  }
}
