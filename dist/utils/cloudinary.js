import { randomUUID } from "node:crypto";
import { unlinkSync } from "node:fs";
import { v2 as cloudinary } from "cloudinary";
import env from "../utils/env.js";
cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
});
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath)
            return null;
        const response = await cloudinary.uploader.upload(localFilePath, {
            public_id: randomUUID(),
            resource_type: "auto",
        });
        console.log(`File uploaded successfully: ${response.public_id}`);
        unlinkSync(localFilePath);
        return response;
    }
    catch (_error) {
        unlinkSync(localFilePath);
        return null;
    }
};
const deleteImageByUrl = async (imageUrl) => {
    try {
        const publicId = imageUrl.split("/").pop()?.split(".")[0];
        const result = await cloudinary.uploader.destroy(publicId);
        console.log("Image deleted successfully:", result);
    }
    catch (error) {
        console.error("Error deleting image:", error.message);
    }
};
export { uploadOnCloudinary, deleteImageByUrl };
