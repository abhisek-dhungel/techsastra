import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth";
import {
  CloudinaryConfigurationError,
  createUploadSignature,
} from "@/lib/cloudinary";

export async function POST() {
  const { error } = await requireApiSession();
  if (error) return error;

  try {
    return NextResponse.json(createUploadSignature());
  } catch (reason) {
    console.error(reason);
    if (reason instanceof CloudinaryConfigurationError) {
      return NextResponse.json(
        {
          error: `Image storage is not configured. Add ${reason.missingVariables.join(", ")} in Vercel and redeploy.`,
          code: "CLOUDINARY_NOT_CONFIGURED",
        },
        { status: 503 },
      );
    }
    return NextResponse.json(
      {
        error: "Cloudinary upload signing failed. Check the Vercel runtime log.",
        code: "CLOUDINARY_SIGNING_FAILED",
      },
      { status: 500 },
    );
  }
}
