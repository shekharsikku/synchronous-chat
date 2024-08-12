"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.getUserInformation = exports.deleteProfileImage = exports.updateProfileImage = exports.userProfileSetup = void 0;
const utils_1 = require("../utils");
const cloudinary_1 = require("../utils/cloudinary");
const unlink_1 = require("../utils/unlink");
const user_1 = __importDefault(require("../models/user"));
const helpers_1 = require("../helpers");
const userProfileSetup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const dataBody = yield req.body;
        if (dataBody.email) {
            throw new utils_1.ApiError(403, "Cannot change email!");
        }
        if (dataBody.username && dataBody.username !== ((_b = req.user) === null || _b === void 0 ? void 0 : _b.username)) {
            const existedUsername = yield user_1.default.findOne({
                username: dataBody.username,
            });
            if (existedUsername) {
                throw new utils_1.ApiError(409, "Username already exists!");
            }
        }
        const updatedProfile = yield user_1.default.findByIdAndUpdate(userId, Object.assign({}, dataBody), { new: true });
        if (updatedProfile) {
            const userProfileFields = {
                email: updatedProfile.email,
                username: updatedProfile.username,
                fullName: updatedProfile.fullName,
            };
            const validateResult = (0, helpers_1.hasEmptyField)(userProfileFields);
            if (!validateResult) {
                userProfileFields._id = updatedProfile._id;
                userProfileFields.imageUrl = updatedProfile.imageUrl;
                userProfileFields.profileColor = updatedProfile.profileColor;
                const { access, refresh } = (0, helpers_1.generateToken)(req, res, updatedProfile._id, false);
                updatedProfile.profileSetup = false;
                updatedProfile.refreshToken = refresh;
                yield updatedProfile.save({ validateBeforeSave: false });
                userProfileFields.authToken = { access, refresh };
                return (0, utils_1.ApiResponse)(req, res, 200, "Profile setup completed successfully!", userProfileFields);
            }
        }
        throw new utils_1.ApiError(400, "Profile setup not completed!");
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(req, res, error.code, error.message);
    }
});
exports.userProfileSetup = userProfileSetup;
const updateProfileImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const profileImagePath = (_b = req.file) === null || _b === void 0 ? void 0 : _b.path;
        if (!profileImagePath) {
            throw new utils_1.ApiError(400, "Profile image file required!");
        }
        const uploadImage = yield (0, cloudinary_1.uploadOnCloudinary)(profileImagePath);
        if (!uploadImage || !uploadImage.url) {
            throw new utils_1.ApiError(500, "Error while uploading profile image!");
        }
        const userProfile = yield user_1.default.findById(userId);
        if (userProfile && userProfile.imageUrl !== "") {
            yield (0, cloudinary_1.deleteImageByUrl)(userProfile.imageUrl);
        }
        if (userProfile && uploadImage.url) {
            userProfile.imageUrl = uploadImage.url;
            yield userProfile.save({ validateBeforeSave: false });
            const tokens = req.token;
            const responseData = {
                _id: userProfile._id,
                email: userProfile.email,
                username: userProfile.username,
                fullName: userProfile.fullName,
                imageUrl: userProfile.imageUrl,
                profileColor: userProfile.profileColor,
                profileSetup: userProfile.profileSetup,
                authToken: tokens,
            };
            return (0, utils_1.ApiResponse)(req, res, 200, "Profile image updated successfully!", responseData);
        }
        throw new utils_1.ApiError(500, "Profile image not updated!");
    }
    catch (error) {
        (0, unlink_1.unlinkFilesWithExtensions)(unlink_1.folderPath, unlink_1.extensionsToDelete);
        return (0, utils_1.ApiResponse)(req, res, error.code, error.message);
    }
});
exports.updateProfileImage = updateProfileImage;
const deleteProfileImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const userProfile = yield user_1.default.findById(userId);
        if (userProfile && userProfile.imageUrl !== "") {
            yield (0, cloudinary_1.deleteImageByUrl)(userProfile.imageUrl);
            userProfile.imageUrl = "";
            yield userProfile.save({ validateBeforeSave: false });
            return (0, utils_1.ApiResponse)(req, res, 301, "Profile image deleted successfully!");
        }
        throw new utils_1.ApiError(400, "Profile image not available!");
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(req, res, error.code, error.message);
    }
});
exports.deleteProfileImage = deleteProfileImage;
const getUserInformation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = req.user;
        const tokens = req.token;
        const responseData = {
            _id: data._id,
            email: data.email,
            username: data.username,
            fullName: data.fullName,
            imageUrl: data.imageUrl,
            profileColor: data.profileColor,
            profileSetup: data.profileSetup,
            authToken: tokens,
        };
        return (0, utils_1.ApiResponse)(req, res, 200, "User profile information!", responseData);
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(req, res, error.code, error.message);
    }
});
exports.getUserInformation = getUserInformation;
const changePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { old_password, new_password } = yield req.body;
        const user = yield user_1.default.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a._id).select("+password");
        if (!user) {
            throw new utils_1.ApiError(403, "Invalid change request!");
        }
        const checked = yield (0, helpers_1.compareHash)(old_password, user === null || user === void 0 ? void 0 : user.password);
        if (!checked) {
            throw new utils_1.ApiError(403, "Invalid old password!");
        }
        user.password = yield (0, helpers_1.generateHash)(new_password);
        yield user.save({ validateBeforeSave: false });
        return (0, utils_1.ApiResponse)(req, res, 202, "Password changed successfully!");
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(req, res, error.code, error.message);
    }
});
exports.changePassword = changePassword;
