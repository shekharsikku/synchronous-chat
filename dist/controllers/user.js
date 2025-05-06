"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userInformation = exports.changePassword = exports.deleteImage = exports.updateImage = exports.profileSetup = void 0;
const bcryptjs_1 = require("bcryptjs");
const utils_1 = require("../utils");
const cloudinary_1 = require("../utils/cloudinary");
const unlink_1 = require("../utils/unlink");
const helpers_1 = require("../helpers");
const user_1 = __importDefault(require("../models/user"));
const profileSetup = async (req, res) => {
    try {
        const { name, username, gender, bio } = (await req.body);
        const requestUser = req.user;
        if (username !== requestUser?.username) {
            const existsUsername = await user_1.default.exists({ username });
            if (existsUsername) {
                throw new utils_1.HttpError(409, "Username already exists!");
            }
        }
        const userDetails = { name, username, gender, bio, setup: false };
        const isCompleted = !(0, helpers_1.hasEmptyField)({ name, username, gender });
        if (isCompleted) {
            userDetails.setup = true;
        }
        const updatedProfile = await user_1.default.findByIdAndUpdate(requestUser?._id, userDetails, { new: true });
        if (!updatedProfile) {
            throw new utils_1.HttpError(400, "Profile setup not completed!");
        }
        const userInfo = (0, helpers_1.createUserInfo)(updatedProfile);
        if (!userInfo.setup) {
            return (0, utils_1.SuccessResponse)(res, 200, "Please, complete your profile!", userInfo);
        }
        (0, helpers_1.generateAccess)(res, userInfo);
        return (0, utils_1.SuccessResponse)(res, 200, "Profile updated successfully!", userInfo);
    }
    catch (error) {
        return (0, utils_1.ErrorResponse)(res, error.code || 500, error.message || "Error while updating profile!");
    }
};
exports.profileSetup = profileSetup;
const updateImage = async (req, res) => {
    try {
        const requestUser = req.user;
        const imagePath = req.file?.path;
        if (!imagePath) {
            throw new utils_1.HttpError(400, "Profile image file required!");
        }
        const [uploadImage, userProfile] = await Promise.all([
            (0, cloudinary_1.uploadOnCloudinary)(imagePath),
            user_1.default.findById(requestUser?._id),
        ]);
        if (!uploadImage || !uploadImage.url) {
            throw new utils_1.HttpError(500, "Error while uploading profile image!");
        }
        if (userProfile && userProfile.image !== "") {
            await (0, cloudinary_1.deleteImageByUrl)(userProfile.image);
        }
        if (userProfile && uploadImage.url) {
            userProfile.image = uploadImage.url;
            await userProfile.save({ validateBeforeSave: true });
            const userInfo = (0, helpers_1.createUserInfo)(userProfile);
            (0, helpers_1.generateAccess)(res, userInfo);
            return (0, utils_1.SuccessResponse)(res, 200, "Profile image updated successfully!", userInfo);
        }
        throw new utils_1.HttpError(500, "Profile image not updated!");
    }
    catch (error) {
        (0, unlink_1.unlinkFilesWithExtensions)(unlink_1.folderPath, unlink_1.extensionsToDelete);
        return (0, utils_1.ErrorResponse)(res, error.code || 500, error.message || "Error while updating profile image!");
    }
};
exports.updateImage = updateImage;
const deleteImage = async (req, res) => {
    try {
        const requestUser = await user_1.default.findById(req.user?._id);
        if (requestUser && requestUser.image !== "") {
            await (0, cloudinary_1.deleteImageByUrl)(requestUser.image);
            requestUser.image = "";
            await requestUser.save({ validateBeforeSave: true });
            const userInfo = (0, helpers_1.createUserInfo)(requestUser);
            (0, helpers_1.generateAccess)(res, userInfo);
            return (0, utils_1.SuccessResponse)(res, 200, "Profile image deleted successfully!", userInfo);
        }
        throw new utils_1.HttpError(400, "Profile image not available!");
    }
    catch (error) {
        return (0, utils_1.ErrorResponse)(res, error.code || 500, error.message || "Error while deleting profile image!");
    }
};
exports.deleteImage = deleteImage;
const changePassword = async (req, res) => {
    try {
        const { old_password, new_password } = (await req.body);
        if (old_password === new_password) {
            throw new utils_1.HttpError(400, "Please, choose a different password!");
        }
        const requestUser = await user_1.default.findById(req.user?._id).select("+password");
        if (!requestUser) {
            throw new utils_1.HttpError(403, "Invalid authorization!");
        }
        const isCorrect = await (0, bcryptjs_1.compare)(old_password, requestUser.password);
        if (!isCorrect) {
            throw new utils_1.HttpError(403, "Incorrect old password!");
        }
        const hashSalt = await (0, bcryptjs_1.genSalt)(12);
        requestUser.password = await (0, bcryptjs_1.hash)(new_password, hashSalt);
        await requestUser.save({ validateBeforeSave: true });
        const userInfo = (0, helpers_1.createUserInfo)(requestUser);
        (0, helpers_1.generateAccess)(res, userInfo);
        return (0, utils_1.SuccessResponse)(res, 200, "Password changed successfully!", userInfo);
    }
    catch (error) {
        return (0, utils_1.ErrorResponse)(res, error.code || 500, error.message || "Error while changing password!");
    }
};
exports.changePassword = changePassword;
const userInformation = async (req, res) => {
    try {
        const user = req.user;
        let message = user?.setup
            ? "User profile information!"
            : "Please, complete your profile!";
        return (0, utils_1.SuccessResponse)(res, 200, message, user);
    }
    catch (error) {
        return (0, utils_1.ErrorResponse)(res, error.code || 500, error.message || "Error while getting user information!");
    }
};
exports.userInformation = userInformation;
