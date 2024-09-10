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
exports.upload = exports.refreshToken = exports.accessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const utils_1 = require("../utils");
const helpers_1 = require("../helpers");
const user_1 = __importDefault(require("../models/user"));
const env_1 = __importDefault(require("../utils/env"));
const multer_1 = __importDefault(require("multer"));
const accessToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accessToken = req.cookies.access;
        if (!accessToken) {
            throw new utils_1.ApiError(401, "Unauthorized access request!");
        }
        const decodedPayload = jsonwebtoken_1.default.verify(accessToken, env_1.default.ACCESS_TOKEN_SECRET);
        const accessUser = yield user_1.default.findById(decodedPayload._id).select("+refreshToken");
        if (!decodedPayload || !accessUser) {
            throw new utils_1.ApiError(403, "Invalid access request!");
        }
        const authTokens = {
            access: accessToken,
            refresh: accessUser.refreshToken,
        };
        req.token = authTokens;
        req.user = accessUser;
        next();
    }
    catch (error) {
        if (error.name === "TokenExpiredError") {
            return (0, utils_1.ApiResponse)(req, res, 401, "Access expired refresh required!!");
        }
        return (0, utils_1.ApiResponse)(req, res, error.code, error.message);
    }
});
exports.accessToken = accessToken;
const refreshToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const refreshToken = req.cookies.refresh;
        if (!refreshToken) {
            throw new utils_1.ApiError(401, "Unauthorized refresh request!");
        }
        const decodedPayload = jsonwebtoken_1.default.verify(refreshToken, env_1.default.REFRESH_TOKEN_SECRET);
        const refreshUser = yield user_1.default.findById(decodedPayload === null || decodedPayload === void 0 ? void 0 : decodedPayload._id).select("+refreshToken");
        if (!decodedPayload ||
            !refreshUser ||
            refreshToken !== (refreshUser === null || refreshUser === void 0 ? void 0 : refreshUser.refreshToken)) {
            throw new utils_1.ApiError(401, "Invalid refresh request!");
        }
        const { access, refresh } = (0, helpers_1.generateToken)(req, res, refreshUser._id, refreshUser.profileSetup);
        refreshUser.refreshToken = refresh;
        yield refreshUser.save({ validateBeforeSave: false });
        const authTokens = { access, refresh };
        req.token = authTokens;
        next();
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(req, res, error.code, error.message);
    }
});
exports.refreshToken = refreshToken;
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
