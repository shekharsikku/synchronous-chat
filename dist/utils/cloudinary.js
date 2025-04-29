"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImageByUrl = exports.uploadOnCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
const env_1 = __importDefault(require("./env"));
const fs_1 = __importDefault(require("fs"));
cloudinary_1.v2.config({
    cloud_name: env_1.default.CLOUDINARY_CLOUD_NAME,
    api_key: env_1.default.CLOUDINARY_API_KEY,
    api_secret: env_1.default.CLOUDINARY_API_SECRET,
});
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath)
            return null;
        const response = await cloudinary_1.v2.uploader.upload(localFilePath, {
            resource_type: "auto",
        });
        console.log(`File uploaded successfully: ${response.url}`);
        fs_1.default.unlinkSync(localFilePath);
        return response;
    }
    catch (error) {
        fs_1.default.unlinkSync(localFilePath);
        return null;
    }
};
exports.uploadOnCloudinary = uploadOnCloudinary;
const deleteImageByUrl = async (imageUrl) => {
    try {
        const publicId = imageUrl.split("/").pop()?.split(".")[0];
        const result = await cloudinary_1.v2.uploader.destroy(publicId);
        console.log("Image deleted successfully:", result);
    }
    catch (error) {
        console.error("Error deleting image:", error.message);
    }
};
exports.deleteImageByUrl = deleteImageByUrl;
