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
exports.createAccessData = exports.maskedDetails = exports.removeSpaces = exports.hasEmptyField = exports.authorizeCookie = exports.generateRefresh = exports.generateAccess = exports.compareHash = exports.generateHash = void 0;
const bcryptjs_1 = require("bcryptjs");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = __importDefault(require("../utils/env"));
const generateHash = (plain) => __awaiter(void 0, void 0, void 0, function* () {
    const salt = yield (0, bcryptjs_1.genSalt)(12);
    const hashed = yield (0, bcryptjs_1.hash)(plain, salt);
    return hashed;
});
exports.generateHash = generateHash;
const compareHash = (plain, hashed) => __awaiter(void 0, void 0, void 0, function* () {
    const checked = yield (0, bcryptjs_1.compare)(plain, hashed);
    return checked;
});
exports.compareHash = compareHash;
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
const removeSpaces = (str) => {
    return str.replace(/\s+/g, "");
};
exports.removeSpaces = removeSpaces;
const capitalizeWord = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
const capitalizeWords = (str) => {
    return str
        .split(" ")
        .map((word) => capitalizeWord(word))
        .join(" ");
};
const maskedObjectId = (objectId) => {
    const idStr = objectId.toString();
    const maskedId = idStr.slice(0, 4) + "****" + idStr.slice(-4);
    return maskedId;
};
const maskedEmail = (email) => {
    const [localPart, domain] = email.split("@");
    const maskedLocalPart = localPart.slice(0, 4) + "***";
    return `${maskedLocalPart}@${domain}`;
};
const maskedDetails = (details) => {
    const maskId = maskedObjectId(details._id);
    const maskEmail = maskedEmail(details.email);
    return {
        _id: maskId,
        email: maskEmail,
        setup: details.setup,
    };
};
exports.maskedDetails = maskedDetails;
const createAccessData = (user) => {
    const accessData = Object.assign(Object.assign({}, user.toObject()), { password: undefined, authentication: undefined });
    return accessData;
};
exports.createAccessData = createAccessData;
