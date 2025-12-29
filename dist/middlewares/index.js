import { inflateSync } from "node:zlib";
import { rateLimit } from "express-rate-limit";
import { compactDecrypt, jwtVerify } from "jose";
import multer from "multer";
import { ZodError } from "zod";
import { User } from "../models/index.js";
import env from "../utils/env.js";
import { generateSecret, generateAccess, generateRefresh, createUserInfo, generateHash } from "../utils/helpers.js";
import { HttpError, ErrorResponse } from "../utils/response.js";
const authAccess = async (req, res, next) => {
    try {
        const accessToken = req.cookies.access;
        if (!accessToken) {
            throw new HttpError(401, "Unauthorized access request!");
        }
        let accessPayload;
        try {
            const accessSecret = await generateSecret();
            const decrypted = await compactDecrypt(accessToken, accessSecret);
            accessPayload = JSON.parse(inflateSync(decrypted.plaintext).toString());
        }
        catch (_error) {
            throw new HttpError(401, "Invalid or expired access request!");
        }
        req.user = accessPayload;
        return next();
    }
    catch (error) {
        return ErrorResponse(res, error.code || 500, error.message || "Error while auth access!");
    }
};
const authRefresh = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refresh;
        const authorizeId = req.cookies.current;
        if (!refreshToken || !authorizeId) {
            throw new HttpError(401, "Unauthorized refresh request!");
        }
        let refreshPayload;
        try {
            const refreshSecret = new TextEncoder().encode(env.REFRESH_SECRET);
            refreshPayload = (await jwtVerify(refreshToken, refreshSecret)).payload;
        }
        catch (_error) {
            await User.updateOne({
                authentication: {
                    $elemMatch: { _id: authorizeId },
                },
            }, {
                $pull: {
                    authentication: { _id: authorizeId },
                },
            });
            res.clearCookie("access");
            res.clearCookie("refresh");
            res.clearCookie("current");
            throw new HttpError(403, "Please, signin again to continue!");
        }
        const userId = refreshPayload.uid;
        const currentTime = Math.floor(Date.now() / 1000);
        const expiresAt = refreshPayload.exp ?? currentTime;
        const hashedRefresh = await generateHash(refreshToken);
        const authFilter = {
            _id: userId,
            authentication: {
                $elemMatch: { _id: authorizeId, token: hashedRefresh },
            },
        };
        const requestUser = await User.findOne(authFilter);
        if (!requestUser) {
            throw new HttpError(401, "Invalid authorization!");
        }
        const userInfo = createUserInfo(requestUser);
        const shouldRotate = currentTime >= expiresAt - env.REFRESH_EXPIRY / 2;
        if (shouldRotate) {
            const newRefreshToken = await generateRefresh(res, userId, authorizeId);
            const newHashedRefresh = await generateHash(newRefreshToken);
            const newRefreshExpiry = new Date(Date.now() + env.REFRESH_EXPIRY * 1000);
            const updatedResult = await User.updateOne(authFilter, {
                $set: {
                    "authentication.$.token": newHashedRefresh,
                    "authentication.$.expiry": newRefreshExpiry,
                },
            });
            if (updatedResult.modifiedCount === 0) {
                throw new HttpError(403, "Please, signin again to continue!");
            }
        }
        await generateAccess(res, userInfo);
        req.user = userInfo;
        return next();
    }
    catch (error) {
        return ErrorResponse(res, error.code || 500, error.message || "Error while token refresh!");
    }
};
const storage = multer.diskStorage({
    destination: function (_req, _file, cb) {
        cb(null, "./public/temp");
    },
    filename: function (_req, file, cb) {
        cb(null, file.originalname);
    },
});
const upload = multer({ storage });
const validate = (schema) => (req, res, next) => {
    try {
        req.body = schema.parse(req.body);
        return next();
    }
    catch (error) {
        if (error instanceof ZodError && error.name === "ZodError") {
            const errors = JSON.parse(error.message);
            return ErrorResponse(res, 400, "Validation error occurred!", errors);
        }
        return ErrorResponse(res, 400, "Validation error occurred!", error);
    }
};
const delay = (milliseconds) => {
    return async (_req, _res, next) => {
        await new Promise((resolve) => setTimeout(resolve, milliseconds));
        console.log(`Delay api by ${milliseconds}ms.`);
        next();
    };
};
const limiter = (minute = 10, limit = 1000) => {
    return rateLimit({
        windowMs: minute * 60 * 1000,
        limit: limit,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req, _res) => {
            return req.clientIp;
        },
        handler: (req, _res, _next) => {
            console.error(`Rate limit exceeded for IP: ${req.clientIp}`);
            throw new HttpError(429, "Maximum number of requests exceeded!");
        },
    });
};
export { authAccess, authRefresh, upload, validate, delay, limiter };
