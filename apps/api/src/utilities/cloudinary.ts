import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import sharp from "sharp";
import env from "#/configs/env.js";
import logger from "#/configs/logger.js";
import { HttpError } from "./response.js";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

const imageFormats = new Set(["gif", "jpg", "jpeg", "png", "webp"]);

export const uploadToCloudinary = async (fileData: Express.Multer.File) => {
  const image = sharp(fileData.buffer, { failOn: "error" });
  const { format } = await image.metadata();

  if (!format || !imageFormats.has(format)) {
    throw new HttpError(400, "Unsupported image format!");
  }

  const buffer = await image.resize(256, null, { withoutEnlargement: true }).webp().toBuffer();

  return new Promise<UploadApiResponse>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream((error, response) => {
        if (error || !response) {
          logger.error({ err: error }, "Error uploading image!");
          reject(new HttpError(500, "Failed to upload image!"));
          return;
        }

        logger.debug({ response }, "Image uploaded successfully!");
        resolve(response);
      })
      .end(buffer);
  });
};

export const deleteFromCloudinary = async (imageUrl: string) => {
  try {
    const publicId = imageUrl.split("/").pop()?.split(".")[0];
    if (!publicId) return;

    const response = await cloudinary.uploader.destroy(publicId);
    logger.debug({ response }, "Image deleted successfully!");
  } catch (err) {
    logger.error({ err }, "Error deleting image!");
  }
};
