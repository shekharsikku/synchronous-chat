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
exports.userInformation = exports.changePassword = exports.deleteImage = exports.updateImage = exports.profileSetup = void 0;
const bcryptjs_1 = require("bcryptjs");
const utils_1 = require("../utils");
const cloudinary_1 = require("../utils/cloudinary");
const unlink_1 = require("../utils/unlink");
const helpers_1 = require("../helpers");
const user_1 = __importDefault(require("../models/user"));
const profileSetup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, username, gender, bio } = yield req.body;
        const requestUser = req.user;
        if (username !== (requestUser === null || requestUser === void 0 ? void 0 : requestUser.username)) {
            const existsUsername = yield user_1.default.exists({ username });
            if (existsUsername) {
                throw new utils_1.ApiError(409, "Username already exists!");
            }
        }
        const userDetails = { name, username, gender, bio, setup: false };
        const isCompleted = !(0, helpers_1.hasEmptyField)({ name, username, gender });
        if (isCompleted) {
            userDetails.setup = true;
        }
        const updatedProfile = yield user_1.default.findByIdAndUpdate(requestUser === null || requestUser === void 0 ? void 0 : requestUser._id, userDetails, { new: true });
        if (!updatedProfile) {
            throw new utils_1.ApiError(400, "Profile setup not completed!");
        }
        const userInfo = (0, helpers_1.createUserInfo)(updatedProfile);
        if (!userInfo.setup) {
            return (0, utils_1.ApiResponse)(res, 200, "Please, complete your profile!", userInfo);
        }
        const accessToken = (0, helpers_1.generateAccess)(res, userInfo);
        return (0, utils_1.ApiResponse)(res, 200, "Profile updated successfully!", userInfo);
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, error.code, error.message);
    }
});
exports.profileSetup = profileSetup;
const updateImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const requestUser = req.user;
        const imagePath = (_a = req.file) === null || _a === void 0 ? void 0 : _a.path;
        if (!imagePath) {
            throw new utils_1.ApiError(400, "Profile image file required!");
        }
        const [uploadImage, userProfile] = yield Promise.all([
            (0, cloudinary_1.uploadOnCloudinary)(imagePath),
            user_1.default.findById(requestUser === null || requestUser === void 0 ? void 0 : requestUser._id),
        ]);
        if (!uploadImage || !uploadImage.url) {
            throw new utils_1.ApiError(500, "Error while uploading profile image!");
        }
        if (userProfile && userProfile.image !== "") {
            yield (0, cloudinary_1.deleteImageByUrl)(userProfile.image);
        }
        if (userProfile && uploadImage.url) {
            userProfile.image = uploadImage.url;
            yield userProfile.save({ validateBeforeSave: true });
            const userInfo = (0, helpers_1.createUserInfo)(userProfile);
            const accessToken = (0, helpers_1.generateAccess)(res, userInfo);
            return (0, utils_1.ApiResponse)(res, 200, "Profile image updated successfully!", userInfo);
        }
        throw new utils_1.ApiError(500, "Profile image not updated!");
    }
    catch (error) {
        (0, unlink_1.unlinkFilesWithExtensions)(unlink_1.folderPath, unlink_1.extensionsToDelete);
        return (0, utils_1.ApiResponse)(res, error.code, error.message);
    }
});
exports.updateImage = updateImage;
const deleteImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const requestUser = yield user_1.default.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
        if (requestUser && requestUser.image !== "") {
            yield (0, cloudinary_1.deleteImageByUrl)(requestUser.image);
            requestUser.image = "";
            yield requestUser.save({ validateBeforeSave: true });
            const userInfo = (0, helpers_1.createUserInfo)(requestUser);
            const accessToken = (0, helpers_1.generateAccess)(res, userInfo);
            return (0, utils_1.ApiResponse)(res, 200, "Profile image deleted successfully!", userInfo);
        }
        throw new utils_1.ApiError(400, "Profile image not available!");
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, error.code, error.message);
    }
});
exports.deleteImage = deleteImage;
const changePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { old_password, new_password } = yield req.body;
        if (old_password === new_password) {
            throw new utils_1.ApiError(400, "Please, choose a different password!");
        }
        const requestUser = yield user_1.default.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a._id).select("+password");
        if (!requestUser) {
            throw new utils_1.ApiError(403, "Invalid authorization!");
        }
        const isCorrect = yield (0, bcryptjs_1.compare)(old_password, requestUser.password);
        if (!isCorrect) {
            throw new utils_1.ApiError(403, "Incorrect old password!");
        }
        const hashSalt = yield (0, bcryptjs_1.genSalt)(12);
        const hashedPassword = yield (0, bcryptjs_1.hash)(new_password, hashSalt);
        requestUser.password = hashedPassword;
        yield requestUser.save({ validateBeforeSave: true });
        const userInfo = (0, helpers_1.createUserInfo)(requestUser);
        const accessToken = (0, helpers_1.generateAccess)(res, userInfo);
        return (0, utils_1.ApiResponse)(res, 200, "Password changed successfully!", userInfo);
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, error.code, error.message);
    }
});
exports.changePassword = changePassword;
const userInformation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        let message = (user === null || user === void 0 ? void 0 : user.setup)
            ? "User profile information!"
            : "Please, complete your profile!";
        return (0, utils_1.ApiResponse)(res, 200, message, user);
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, error.code, error.message);
    }
});
exports.userInformation = userInformation;
