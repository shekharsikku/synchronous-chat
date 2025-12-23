import { v2 as cloudinary } from "cloudinary";
import { randomUUID } from "crypto";
import env from "@utils/env.js";
import fs from "fs";

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
    console.log(`File uploaded successfully: ${response.public_id}`);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    return null;
  }
};

const deleteImageByUrl = async (imageUrl: string) => {
  try {
    const publicId = imageUrl.split("/").pop()?.split(".")[0];
    const result = await cloudinary.uploader.destroy(publicId!);
    console.log("Image deleted successfully:", result);
  } catch (error: any) {
    console.error("Error deleting image:", error.message);
  }
};

export { uploadOnCloudinary, deleteImageByUrl };
