import { genSalt, hash, compare } from "bcryptjs";
import { User } from "../models/index.js";
import { getSocketId, io } from "../server.js";
import { eventsService } from "../services/events.js";
import { deleteImageByUrl, uploadOnCloudinary } from "../utils/cloudinary.js";
import { hasEmptyField, createUserInfo, generateAccess } from "../utils/helpers.js";
import { HttpError, ErrorResponse, SuccessResponse } from "../utils/response.js";
import { unlinkFilesWithExtensions, extensionsToDelete, folderPath } from "../utils/unlink.js";
const profileUpdateEvents = async (userData) => {
    const userSocketIds = getSocketId(userData._id?.toString());
    io.to(userSocketIds).emit("profile:update", userData);
};
const profileSetup = async (req, res) => {
    try {
        const { name, username, gender, bio } = req.body;
        const requestUser = req.user;
        if (username !== requestUser?.username) {
            const existsUsername = await User.exists({ username });
            if (existsUsername) {
                throw new HttpError(409, "Username already exists!");
            }
        }
        const wasSetup = requestUser?.setup;
        const userDetails = { name, username, gender, bio, setup: false };
        const isCompleted = !hasEmptyField({ name, username, gender });
        if (isCompleted) {
            userDetails.setup = true;
        }
        const updatedProfile = await User.findByIdAndUpdate(requestUser?._id, userDetails, {
            new: true,
        });
        if (!updatedProfile) {
            throw new HttpError(400, "Profile setup not completed!");
        }
        const userInfo = createUserInfo(updatedProfile);
        if (!wasSetup && userInfo.setup) {
            eventsService.send(requestUser._id.toString(), "profile-setup-complete", userInfo);
        }
        if (!userInfo.setup) {
            return SuccessResponse(res, 200, "Please, complete your profile!");
        }
        await generateAccess(res, userInfo);
        await profileUpdateEvents(userInfo);
        return SuccessResponse(res, 200, "Profile updated successfully!");
    }
    catch (error) {
        return ErrorResponse(res, error.code || 500, error.message || "Error while updating profile!");
    }
};
const updateImage = async (req, res) => {
    try {
        const requestUser = req.user;
        const imagePath = req.file?.path;
        if (!imagePath) {
            throw new HttpError(400, "Profile image file required!");
        }
        const [uploadImage, userProfile] = await Promise.all([
            uploadOnCloudinary(imagePath),
            User.findById(requestUser?._id),
        ]);
        if (!uploadImage || !uploadImage.secure_url) {
            throw new HttpError(500, "Error while uploading profile image!");
        }
        if (userProfile && userProfile.image !== "") {
            await deleteImageByUrl(userProfile.image);
        }
        if (userProfile && uploadImage.secure_url) {
            userProfile.image = uploadImage.secure_url;
            await userProfile.save({ validateBeforeSave: true });
            const userInfo = createUserInfo(userProfile);
            await generateAccess(res, userInfo);
            await profileUpdateEvents(userInfo);
            return SuccessResponse(res, 200, "Profile image updated successfully!");
        }
        throw new HttpError(500, "Profile image not updated!");
    }
    catch (error) {
        unlinkFilesWithExtensions(folderPath, extensionsToDelete);
        return ErrorResponse(res, error.code || 500, error.message || "Error while updating profile image!");
    }
};
const deleteImage = async (req, res) => {
    try {
        const requestUser = await User.findById(req.user?._id);
        if (requestUser && requestUser.image !== "") {
            await deleteImageByUrl(requestUser.image);
            requestUser.image = "";
            await requestUser.save({ validateBeforeSave: true });
            const userInfo = createUserInfo(requestUser);
            await generateAccess(res, userInfo);
            await profileUpdateEvents(userInfo);
            return SuccessResponse(res, 200, "Profile image deleted successfully!");
        }
        throw new HttpError(400, "Profile image not available!");
    }
    catch (error) {
        return ErrorResponse(res, error.code || 500, error.message || "Error while deleting profile image!");
    }
};
const changePassword = async (req, res) => {
    try {
        const { old_password, new_password } = req.body;
        if (old_password === new_password) {
            throw new HttpError(400, "Please, choose a different password!");
        }
        const requestUser = await User.findById(req.user?._id).select("+password");
        if (!requestUser) {
            throw new HttpError(401, "Invalid authorization!");
        }
        const isCorrect = await compare(old_password, requestUser.password);
        if (!isCorrect) {
            throw new HttpError(401, "Incorrect old password!");
        }
        const hashSalt = await genSalt(12);
        requestUser.password = await hash(new_password, hashSalt);
        await requestUser.save({ validateBeforeSave: true });
        const userInfo = createUserInfo(requestUser);
        await generateAccess(res, userInfo);
        return SuccessResponse(res, 200, "Password changed successfully!");
    }
    catch (error) {
        return ErrorResponse(res, error.code || 500, error.message || "Error while changing password!");
    }
};
const userInformation = async (req, res) => {
    try {
        const user = req.user;
        let message = user?.setup ? "User profile information!" : "Please, complete your profile!";
        return SuccessResponse(res, 200, message, user);
    }
    catch (error) {
        return ErrorResponse(res, error.code || 500, error.message || "Error while getting user information!");
    }
};
export { profileSetup, updateImage, deleteImage, changePassword, userInformation };
