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
exports.upload = exports.authRefresh = exports.authAccess = void 0;
const utils_1 = require("../utils");
const helpers_1 = require("../helpers");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_1 = __importDefault(require("../models/user"));
const env_1 = __importDefault(require("../utils/env"));
const multer_1 = __importDefault(require("multer"));
const authAccess = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accessToken = req.cookies.access;
        if (!accessToken) {
            throw new utils_1.ApiError(401, "Unauthorized access request!");
        }
        let decodedPayload;
        try {
            decodedPayload = jsonwebtoken_1.default.verify(accessToken, env_1.default.ACCESS_SECRET, {
                algorithms: ["HS256"],
            });
        }
        catch (error) {
            throw new utils_1.ApiError(403, "Invalid access request!");
        }
        req.user = decodedPayload.user;
        next();
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, error.code, error.message);
    }
});
exports.authAccess = authAccess;
const deleteToken = (req, res, userId, refreshToken) => __awaiter(void 0, void 0, void 0, function* () {
    const authorizeId = req.cookies.auth_id;
    const deleteResponse = yield user_1.default.findOneAndUpdate({ _id: userId }, {
        $pull: {
            authentication: { _id: authorizeId, token: refreshToken },
        },
    }, { new: true });
    if (deleteResponse) {
        res.clearCookie("access");
        res.clearCookie("refresh");
        res.clearCookie("auth_id");
    }
});
const authRefresh = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const refreshToken = req.cookies.refresh;
        if (!refreshToken) {
            throw new utils_1.ApiError(401, "Unauthorized refresh request!");
        }
        let decodedPayload;
        try {
            decodedPayload = jsonwebtoken_1.default.verify(refreshToken, env_1.default.REFRESH_SECRET, {
                algorithms: ["HS512"],
                ignoreExpiration: true,
                ignoreNotBefore: true,
            });
        }
        catch (error) {
            throw new utils_1.ApiError(401, "Invalid refresh request!");
        }
        const userId = decodedPayload.uid;
        const currentTime = Math.floor(Date.now() / 1000);
        const beforeExpires = decodedPayload.exp - env_1.default.ACCESS_EXPIRY;
        const requestUser = yield user_1.default.findOne({
            _id: userId,
            authentication: {
                $elemMatch: { token: refreshToken },
            },
        });
        if (!requestUser) {
            throw new utils_1.ApiError(403, "Invalid user request!");
        }
        let authTokens = {};
        const accessData = (0, helpers_1.createAccessData)(requestUser);
        if (currentTime >= beforeExpires && currentTime < decodedPayload.exp) {
            const newRefreshToken = (0, helpers_1.generateRefresh)(res, userId);
            const refreshExpiry = env_1.default.REFRESH_EXPIRY;
            const authorizeId = req.cookies.auth_id;
            const updatedAuth = yield user_1.default.findOneAndUpdate({
                _id: userId,
                authentication: {
                    $elemMatch: { _id: authorizeId, token: refreshToken },
                },
            }, {
                $set: {
                    "authentication.$.token": newRefreshToken,
                    "authentication.$.expiry": new Date(Date.now() + refreshExpiry * 1000),
                },
            }, { new: true });
            if (updatedAuth) {
                (0, helpers_1.authorizeCookie)(res, authorizeId);
                const accessToken = (0, helpers_1.generateAccess)(res, accessData);
                authTokens.access = accessToken;
                authTokens.refresh = newRefreshToken;
            }
        }
        else if (currentTime >= decodedPayload.exp) {
            yield deleteToken(req, res, requestUser._id, refreshToken);
            throw new utils_1.ApiError(401, "Please, login again to continue!");
        }
        else {
            const accessToken = (0, helpers_1.generateAccess)(res, accessData);
            authTokens.access = accessToken;
        }
        req.user = requestUser;
        req.token = authTokens;
        next();
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, error.code, error.message);
    }
});
exports.authRefresh = authRefresh;
const storage = multer_1.default.diskStorage({
    destination: function (_req, _file, cb) {
        cb(null, "./public/temp");
    },
    filename: function (_req, file, cb) {
        cb(null, file.originalname);
    },
});
const upload = (0, multer_1.default)({ storage });
exports.upload = upload;
