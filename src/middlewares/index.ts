import { inflateSync } from "node:zlib";

import { rateLimit } from "express-rate-limit";
import { compactDecrypt, jwtVerify } from "jose";
import { Types } from "mongoose";
import multer from "multer";
import { ZodError, type ZodType } from "zod";

import logger from "#/middlewares/logger.js";
import { User } from "#/models/index.js";
import env from "#/utils/env.js";
import {
  cookieOptions,
  generateSecret,
  generateAccess,
  generateRefresh,
  createUserInfo,
  generateHash,
} from "#/utils/helpers.js";
import { HttpError, HttpHandler } from "#/utils/response.js";

import type { UserInterface } from "#/interfaces/index.js";
import type { NextFunction, Request, Response } from "express";

const parseAuthKey = (authKey: any) => {
  const [firstKey, secondKey] = authKey.split(":", 2);

  if (!Types.ObjectId.isValid(firstKey) || !Types.ObjectId.isValid(secondKey)) {
    throw new Error("Invalid authentication key!");
  }

  return { userId: new Types.ObjectId(firstKey), authId: new Types.ObjectId(secondKey) };
};

export const revokeToken = async (res: Response, authKey: any) => {
  try {
    const { userId, authId } = parseAuthKey(authKey);

    await User.updateOne(
      {
        _id: userId,
        authentication: {
          $elemMatch: { _id: authId },
        },
      },
      {
        $pull: {
          authentication: { _id: authId },
        },
      }
    );
  } catch (err) {
    logger.error({ err }, "Unknown error occurred!");
  } finally {
    res.clearCookie("access", cookieOptions);
    res.clearCookie("refresh", cookieOptions);
    res.clearCookie("current", cookieOptions);
  }
};

export const authAccess = HttpHandler.wrap(async (req, _res, next) => {
  const accessToken = req.cookies["access"];

  if (!accessToken) {
    throw new HttpError(401, "Unauthorized access request!");
  }

  let accessPayload;

  try {
    const accessSecret = await generateSecret();
    const decrypted = await compactDecrypt(accessToken, accessSecret);
    accessPayload = JSON.parse(inflateSync(decrypted.plaintext).toString());
  } catch {
    throw new HttpError(401, "Invalid or expired access request!");
  }

  req.user = accessPayload as UserInterface;
  return next();
});

export const authRefresh = HttpHandler.wrap(async (req, res) => {
  const deviceId = req.headers["x-device-id"] as string;
  const refreshToken = req.cookies["refresh"];
  const currentAuthKey = req.cookies["current"];

  if (!refreshToken || !currentAuthKey) {
    throw new HttpError(401, "Unauthorized refresh request!");
  }

  let userId: Types.ObjectId;
  let authorizeId: Types.ObjectId;
  let hashedRefresh: string;
  let refreshExpiry: number | undefined;

  try {
    const parsedPayload = parseAuthKey(currentAuthKey);
    authorizeId = parsedPayload.authId;

    const refreshSecret = new TextEncoder().encode(env.REFRESH_SECRET);

    const [jwtResult, hashedToken] = await Promise.all([
      jwtVerify(refreshToken, refreshSecret),
      generateHash(refreshToken),
    ]);

    hashedRefresh = hashedToken;
    refreshExpiry = jwtResult.payload.exp;

    if (
      !Types.ObjectId.isValid(jwtResult.payload.uid!) ||
      !parsedPayload.userId.equals(new Types.ObjectId(jwtResult.payload.uid)) ||
      jwtResult.payload.jti !== deviceId
    ) {
      throw new Error("Refresh request mismatch!");
    }

    userId = parsedPayload.userId;
  } catch {
    await revokeToken(res, currentAuthKey);
    throw new HttpError(403, "Please, signin again to continue!");
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const expiresAt = refreshExpiry ?? currentTime;

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
    const newRefreshToken = await generateRefresh(res, userId, authorizeId, deviceId);
    const newHashedRefresh = await generateHash(newRefreshToken);
    const newRefreshExpiry = new Date(Date.now() + env.REFRESH_EXPIRY * 1000);

    const updatedResult = await User.updateOne(authFilter, {
      $set: {
        "authentication.$.token": newHashedRefresh,
        "authentication.$.expiry": newRefreshExpiry,
      },
    });

    if (updatedResult.modifiedCount === 0) {
      await revokeToken(res, currentAuthKey);
      throw new HttpError(403, "Please, signin again to continue!");
    }
  }

  await generateAccess(res, userInfo);

  return HttpHandler.success(res, 200, "Token refreshed successfully!");
});

export const authEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accessToken = req.cookies["access"];
    if (!accessToken) return res.sendStatus(401);

    const accessSecret = await generateSecret();
    const decryptedAccess = await compactDecrypt(accessToken, accessSecret);
    const accessPayload = JSON.parse(inflateSync(decryptedAccess.plaintext).toString());

    req.user = accessPayload as UserInterface;
    return next();
  } catch {
    return res.sendStatus(401);
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

/** Multer File Uploader */
export const upload = multer({ storage });

/** Zod Schema Validator */
export const validate =
  <T>(schema: ZodType<T>) =>
  (req: Request<{}, {}, T>, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      return next();
    } catch (error: any) {
      if (error instanceof ZodError && error.name === "ZodError") {
        const errors = JSON.parse(error.message);
        return HttpHandler.error(res, 400, "Validation error occurred!", errors);
      }
      return HttpHandler.error(res, 400, "Validation error occurred!", error);
    }
  };

/** Rate Limiter */
export const limiter = (minute = 10, limit = 1000) => {
  return rateLimit({
    windowMs: minute * 60 * 1000,
    limit: limit,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request, _res: Response) => {
      return req.clientIp!;
    },
    handler: (req: Request, _res: Response, _next: NextFunction) => {
      req.log.error(`Rate limit exceeded for IP: ${req.clientIp}`);
      throw new HttpError(429, "Maximum number of requests exceeded!");
    },
  });
};
