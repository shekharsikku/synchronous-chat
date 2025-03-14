"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserInfo = exports.hasEmptyField = exports.authorizeCookie = exports.generateRefresh = exports.generateAccess = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = __importDefault(require("../utils/env"));
const generateAccess = (res, user) => {
    const accessExpiry = env_1.default.ACCESS_EXPIRY;
    const accessToken = jsonwebtoken_1.default.sign({ user }, env_1.default.ACCESS_SECRET, {
        algorithm: "HS256",
        expiresIn: accessExpiry,
    });
    res.cookie("access", accessToken, {
        maxAge: accessExpiry * 1000,
        httpOnly: true,
        sameSite: "strict",
        secure: env_1.default.isProd,
    });
    return accessToken;
};
exports.generateAccess = generateAccess;
const generateRefresh = (res, uid) => {
    const refreshExpiry = env_1.default.REFRESH_EXPIRY;
    const refreshToken = jsonwebtoken_1.default.sign({ uid }, env_1.default.REFRESH_SECRET, {
        algorithm: "HS512",
        expiresIn: refreshExpiry,
    });
    res.cookie("refresh", refreshToken, {
        maxAge: refreshExpiry * 1000 * 2,
        httpOnly: true,
        sameSite: "strict",
        secure: env_1.default.isProd,
    });
    return refreshToken;
};
exports.generateRefresh = generateRefresh;
const authorizeCookie = (res, authId) => {
    const authExpiry = env_1.default.REFRESH_EXPIRY;
    res.cookie("current", authId, {
        maxAge: authExpiry * 1000 * 2,
        httpOnly: true,
        sameSite: "strict",
        secure: env_1.default.isProd,
    });
};
exports.authorizeCookie = authorizeCookie;
const hasEmptyField = (fields) => {
    return Object.values(fields).some((value) => value === "" || value === undefined || value === null);
};
exports.hasEmptyField = hasEmptyField;
const createUserInfo = (user) => {
    let userInfo;
    if (user.setup) {
        userInfo = {
            ...user.toObject(),
            password: undefined,
            authentication: undefined,
        };
    }
    else {
        userInfo = {
            _id: user._id,
            email: user.email,
            setup: user.setup,
        };
    }
    return userInfo;
};
exports.createUserInfo = createUserInfo;
