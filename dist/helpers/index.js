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
exports.removeSpaces = exports.hasEmptyField = exports.generateToken = exports.validateSchema = exports.compareHash = exports.generateHash = void 0;
const bcryptjs_1 = require("bcryptjs");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = __importDefault(require("../utils/env"));
const utils_1 = require("../utils");
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
const validateSchema = (schema) => (req, res, next) => {
    try {
        schema.parse(req.body);
        next();
    }
    catch (error) {
        const errors = (0, utils_1.ValidationError)(error);
        return (0, utils_1.ApiResponse)(req, res, 400, errors[0].message);
    }
};
exports.validateSchema = validateSchema;
const generateToken = (_req, res, _id, setup) => {
    const accessExpiry = parseInt(env_1.default.ACCESS_TOKEN_EXPIRY);
    const access = jsonwebtoken_1.default.sign({ _id }, env_1.default.ACCESS_TOKEN_SECRET, {
        algorithm: "HS256",
        expiresIn: accessExpiry,
    });
    res.cookie("access", access, {
        maxAge: parseInt(env_1.default.ACCESS_COOKIE_EXPIRY),
        httpOnly: true,
        sameSite: "strict",
        secure: env_1.default.NODE_ENV !== "development",
    });
    if (!setup) {
        const refresh = jsonwebtoken_1.default.sign({ _id }, env_1.default.REFRESH_TOKEN_SECRET, {
            algorithm: "HS256",
            expiresIn: parseInt(env_1.default.REFRESH_TOKEN_EXPIRY),
            notBefore: accessExpiry - 900,
        });
        res.cookie("refresh", refresh, {
            maxAge: parseInt(env_1.default.REFRESH_COOKIE_EXPIRY),
            httpOnly: true,
            sameSite: "strict",
            secure: env_1.default.NODE_ENV !== "development",
        });
        return { access, refresh };
    }
    return { access };
};
exports.generateToken = generateToken;
const hasEmptyField = (fields) => {
    return Object.values(fields).some((value) => value === "" || value === undefined);
};
exports.hasEmptyField = hasEmptyField;
const removeSpaces = (str) => {
    return str.replace(/\s+/g, "");
};
exports.removeSpaces = removeSpaces;
