"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshAuth = exports.signOutUser = exports.signInUser = exports.signUpUser = void 0;
const bcryptjs_1 = require("bcryptjs");
const utils_1 = require("../utils");
const helpers_1 = require("../helpers");
const user_1 = __importDefault(require("../models/user"));
const env_1 = __importDefault(require("../utils/env"));
const signUpUser = async (req, res) => {
    try {
        const { email, password } = (await req.body);
        const existsEmail = await user_1.default.exists({ email });
        if (existsEmail) {
            throw new utils_1.HttpError(409, "Email already exists!");
        }
        const hashSalt = await (0, bcryptjs_1.genSalt)(12);
        const hashedPassword = await (0, bcryptjs_1.hash)(password, hashSalt);
        await user_1.default.create({ email, password: hashedPassword });
        return (0, utils_1.SuccessResponse)(res, 201, "Signed up successfully!");
    }
    catch (error) {
        return (0, utils_1.ErrorResponse)(res, error.code || 500, error.message || "Error while user signup!");
    }
};
exports.signUpUser = signUpUser;
const signInUser = async (req, res) => {
    try {
        const { email, password, username } = (await req.body);
        const conditions = [];
        if (email) {
            conditions.push({ email });
        }
        else if (username) {
            conditions.push({ username });
        }
        else {
            throw new utils_1.HttpError(400, "Email or Username required!");
        }
        const existsUser = await user_1.default.findOne({
            $or: conditions,
        }).select("+password +authentication");
        if (!existsUser) {
            throw new utils_1.HttpError(404, "User not exists!");
        }
        const isCorrect = await (0, bcryptjs_1.compare)(password, existsUser.password);
        if (!isCorrect) {
            throw new utils_1.HttpError(403, "Incorrect password!");
        }
        const userInfo = (0, helpers_1.createUserInfo)(existsUser);
        (0, helpers_1.generateAccess)(res, userInfo);
        if (!userInfo.setup) {
            return (0, utils_1.SuccessResponse)(res, 200, "Please, complete your profile!", userInfo);
        }
        const refreshToken = (0, helpers_1.generateRefresh)(res, userInfo._id);
        const refreshExpiry = env_1.default.REFRESH_EXPIRY;
        existsUser.authentication?.push({
            token: refreshToken,
            expiry: new Date(Date.now() + refreshExpiry * 1000),
        });
        const authorizeUser = await existsUser.save();
        const authorizeId = authorizeUser.authentication?.find((auth) => auth.token === refreshToken)?._id;
        (0, helpers_1.authorizeCookie)(res, authorizeId.toString());
        return (0, utils_1.SuccessResponse)(res, 200, "Signed in successfully!", userInfo);
    }
    catch (error) {
        return (0, utils_1.ErrorResponse)(res, error.code || 500, error.message || "Error while user signin!");
    }
};
exports.signInUser = signInUser;
const signOutUser = async (req, res) => {
    const requestUser = req.user;
    const refreshToken = req.cookies.refresh;
    const authorizeId = req.cookies.current;
    if (requestUser.setup && refreshToken && authorizeId) {
        await user_1.default.updateOne({ _id: requestUser._id }, {
            $pull: {
                authentication: { _id: authorizeId, token: refreshToken },
            },
        });
    }
    res.clearCookie("access");
    res.clearCookie("refresh");
    res.clearCookie("current");
    return (0, utils_1.SuccessResponse)(res, 200, "Signed out successfully!");
};
exports.signOutUser = signOutUser;
const refreshAuth = async (req, res) => {
    return (0, utils_1.SuccessResponse)(res, 200, "Authentication refreshed!", req.user);
};
exports.refreshAuth = refreshAuth;
