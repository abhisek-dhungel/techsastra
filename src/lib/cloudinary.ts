import { v2 as cloudinary } from "cloudinary";

export class CloudinaryConfigurationError extends Error {
  constructor(readonly missingVariables: string[]) {
    super(`Missing Cloudinary configuration: ${missingVariables.join(", ")}`);
    this.name = "CloudinaryConfigurationError";
  }
}

function configureCloudinary() {
  const values = {
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY?.trim(),
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET?.trim(),
  };
  const missingVariables = Object.entries(values)
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missingVariables.length > 0) {
    throw new CloudinaryConfigurationError(missingVariables);
  }

  cloudinary.config({
    cloud_name: values.CLOUDINARY_CLOUD_NAME,
    api_key: values.CLOUDINARY_API_KEY,
    api_secret: values.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

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
  configureCloudinary();
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
