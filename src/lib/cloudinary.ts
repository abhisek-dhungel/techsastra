import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const CLOUDINARY_FOLDER = "techsastra";

export interface CloudinaryUpload {
  url: string;
  publicId: string;
}

/**
 * Upload an image buffer to Cloudinary and return the secure URL + public id.
 * Used by both the /api/upload route and the local backfill script.
 */
export function uploadBuffer(
  buffer: Buffer,
  folder: string = CLOUDINARY_FOLDER,
): Promise<CloudinaryUpload> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (err, result) => {
        if (err) return reject(err);
        if (!result) return reject(new Error("Cloudinary returned no result"));
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    ).end(buffer);
  });
}
