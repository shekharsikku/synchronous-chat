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
exports.refreshAuth = exports.signOutUser = exports.signInUser = exports.signUpUser = void 0;
const bcryptjs_1 = require("bcryptjs");
const utils_1 = require("../utils");
const helpers_1 = require("../helpers");
const user_1 = __importDefault(require("../models/user"));
const env_1 = __importDefault(require("../utils/env"));
const signUpUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = yield req.body;
        const existsEmail = yield user_1.default.exists({ email });
        if (existsEmail) {
            throw new utils_1.ApiError(409, "Email already exists!");
        }
        const hashSalt = yield (0, bcryptjs_1.genSalt)(12);
        const hashedPassword = yield (0, bcryptjs_1.hash)(password, hashSalt);
        yield user_1.default.create({ email, password: hashedPassword });
        return (0, utils_1.ApiResponse)(res, 201, "Signed up successfully!");
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, error.code, error.message);
    }
});
exports.signUpUser = signUpUser;
const signInUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { email, password, username } = yield req.body;
        const conditions = [];
        if (email) {
            conditions.push({ email });
        }
        else if (username) {
            conditions.push({ username });
        }
        else {
            throw new utils_1.ApiError(400, "Email or Username required!");
        }
        const existsUser = yield user_1.default.findOne({
            $or: conditions,
        }).select("+password +authentication");
        if (!existsUser) {
            throw new utils_1.ApiError(404, "User not exists!");
        }
        const isCorrect = yield (0, bcryptjs_1.compare)(password, existsUser.password);
        if (!isCorrect) {
            throw new utils_1.ApiError(403, "Incorrect password!");
        }
        const userInfo = (0, helpers_1.createUserInfo)(existsUser);
        (0, helpers_1.generateAccess)(res, userInfo);
        if (!userInfo.setup) {
            return (0, utils_1.ApiResponse)(res, 200, "Please, complete your profile!", userInfo);
        }
        const refreshToken = (0, helpers_1.generateRefresh)(res, userInfo._id);
        const refreshExpiry = env_1.default.REFRESH_EXPIRY;
        (_a = existsUser.authentication) === null || _a === void 0 ? void 0 : _a.push({
            token: refreshToken,
            expiry: new Date(Date.now() + refreshExpiry * 1000),
        });
        const authorizeUser = yield existsUser.save();
        const authorizeId = (_b = authorizeUser.authentication) === null || _b === void 0 ? void 0 : _b.filter((auth) => auth.token === refreshToken)[0]._id;
        (0, helpers_1.authorizeCookie)(res, authorizeId.toString());
        return (0, utils_1.ApiResponse)(res, 200, "Signed in successfully!", userInfo);
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, error.code, error.message);
    }
});
exports.signInUser = signInUser;
const signOutUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const requestUser = req.user;
    const refreshToken = req.cookies.refresh;
    const authorizeId = req.cookies.current;
    if (requestUser.setup && refreshToken && authorizeId) {
        yield user_1.default.updateOne({ _id: requestUser._id }, {
            $pull: {
                authentication: { _id: authorizeId, token: refreshToken },
            },
        });
    }
    res.clearCookie("access");
    res.clearCookie("refresh");
    res.clearCookie("current");
    return (0, utils_1.ApiResponse)(res, 200, "Signed out successfully!");
});
exports.signOutUser = signOutUser;
const refreshAuth = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, utils_1.ApiResponse)(res, 200, "Authentication refreshed!", req.user);
});
exports.refreshAuth = refreshAuth;
