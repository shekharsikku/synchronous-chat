import { randomUUID } from "node:crypto";
import { unlinkSync } from "node:fs";
import { v2 as cloudinary } from "cloudinary";

import logger from "#/middlewares/logger.js";
import env from "#/utils/env.js";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath: string) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      public_id: randomUUID(),
      resource_type: "auto",
    });
    logger.info(response, "File uploaded successfully!");
    unlinkSync(localFilePath);
    return response;
  } catch {
    unlinkSync(localFilePath);
    return null;
  }
};

const deleteImageByUrl = async (imageUrl: string) => {
  try {
    const publicId = imageUrl.split("/").pop()?.split(".")[0];
    const result = await cloudinary.uploader.destroy(publicId!);
    logger.info(result, "Image deleted successfully!");
  } catch (err) {
    logger.error({ err }, "Error deleting image!");
  }
};

export { uploadOnCloudinary, deleteImageByUrl };
