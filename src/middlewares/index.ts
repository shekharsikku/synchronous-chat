import { inflateSync } from "node:zlib";

import { rateLimit } from "express-rate-limit";
import { compactDecrypt, jwtVerify } from "jose";
import { Types } from "mongoose";
import multer from "multer";
import { ZodError, type ZodType } from "zod";

import { User } from "#/models/index.js";
import env from "#/utils/env.js";
import { generateSecret, generateAccess, generateRefresh, createUserInfo, generateHash } from "#/utils/helpers.js";
import { HttpError, ErrorResponse, SuccessResponse } from "#/utils/response.js";

import type { UserInterface } from "#/interface/index.js";
import type { NextFunction, Request, Response } from "express";

const parseAuthKey = (authKey: any) => {
  const [firstKey, secondKey] = authKey.split(":", 2);

  if (!Types.ObjectId.isValid(firstKey) || !Types.ObjectId.isValid(secondKey)) {
    throw new Error("Invalid authentication key!");
  }

  return { userId: new Types.ObjectId(firstKey), authId: new Types.ObjectId(secondKey) };
};

const revokeToken = async (res: Response, authKey: any) => {
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
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
  } finally {
    res.clearCookie("access");
    res.clearCookie("refresh");
    res.clearCookie("current");
  }
};

const authAccess = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
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
    } catch (_error) {
      throw new HttpError(401, "Invalid or expired access request!");
    }

    req.user = accessPayload as UserInterface;
    return next();
  } catch (error: any) {
    return ErrorResponse(res, error.code || 500, error.message || "Error while auth access!");
  }
};

const authRefresh = async (req: Request, res: Response) => {
  try {
    const deviceId = req.headers["x-device-id"] as string;
    const refreshToken = req.cookies.refresh;
    const currentAuthKey = req.cookies.current;

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
    } catch (_error: any) {
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

    return SuccessResponse(res, 200, "Token refreshed successfully!");
  } catch (error: any) {
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

const validate =
  <T>(schema: ZodType<T>) =>
  (req: Request<{}, {}, T>, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      return next();
    } catch (error: any) {
      if (error instanceof ZodError && error.name === "ZodError") {
        const errors = JSON.parse(error.message);
        return ErrorResponse(res, 400, "Validation error occurred!", errors);
      }
      return ErrorResponse(res, 400, "Validation error occurred!", error);
    }
  };

const delay = (milliseconds: number) => {
  return async (_req: Request, _res: Response, next: NextFunction) => {
    await new Promise((resolve) => setTimeout(resolve, milliseconds));
    console.log(`Delay api by ${milliseconds}ms.`);
    next();
  };
};

/** Rate Limiter */
const limiter = (minute = 10, limit = 1000) => {
  return rateLimit({
    windowMs: minute * 60 * 1000,
    limit: limit,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request, _res: Response) => {
      return req.clientIp!;
    },
    handler: (req: Request, _res: Response, _next: NextFunction) => {
      console.error(`Rate limit exceeded for IP: ${req.clientIp}`);
      throw new HttpError(429, "Maximum number of requests exceeded!");
    },
  });
};

export { revokeToken, authAccess, authRefresh, upload, validate, delay, limiter };
