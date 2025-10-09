import type { NextFunction, Request, Response } from "express";
import type { UserInterface } from "../interface/index.js";
import type { ZodType } from "zod";
import type { Types } from "mongoose";
import { HttpError, ErrorResponse } from "../utils/index.js";
import { generateSecret, generateAccess, generateRefresh, authorizeCookie, createUserInfo } from "../utils/helpers.js";
import { User } from "../models/index.js";
import { compactDecrypt, jwtVerify } from "jose";
import { rateLimit } from "express-rate-limit";
import { inflateSync } from "zlib";
import env from "../utils/env.js";
import multer from "multer";

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
    } catch (error: any) {
      throw new HttpError(401, "Invalid or expired access request!");
    }

    req.user = accessPayload as UserInterface;
    next();
  } catch (error: any) {
    return ErrorResponse(res, error.code || 500, error.message || "Error while auth access!");
  }
};

const authRefresh = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
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
    } catch (error: any) {
      await User.updateOne(
        {
          authentication: {
            $elemMatch: { _id: authorizeId, token: refreshToken },
          },
        },
        {
          $pull: {
            authentication: { _id: authorizeId, token: refreshToken },
          },
        }
      );

      res.clearCookie("access");
      res.clearCookie("refresh");
      res.clearCookie("current");

      throw new HttpError(403, "Please, signin again to continue!");
    }

    const userId = refreshPayload.uid as Types.ObjectId;
    const currentTime = Math.floor(Date.now() / 1000);
    const expiresAt = refreshPayload.exp ?? currentTime;

    const authFilter = {
      _id: userId,
      authentication: {
        $elemMatch: { _id: authorizeId, token: refreshToken },
      },
    };

    const requestUser = await User.findOne(authFilter);

    if (!requestUser) {
      throw new HttpError(401, "Invalid authorization!");
    }

    const userInfo = createUserInfo(requestUser);
    const shouldRotate = currentTime >= expiresAt - env.REFRESH_EXPIRY / 2;

    if (shouldRotate) {
      const newRefreshToken = await generateRefresh(res, userId);
      const newRefreshExpiry = new Date(Date.now() + env.REFRESH_EXPIRY * 1000);

      const updatedResult = await User.updateOne(authFilter, {
        $set: {
          "authentication.$.token": newRefreshToken,
          "authentication.$.expiry": newRefreshExpiry,
        },
      });

      if (updatedResult.modifiedCount === 0) {
        throw new HttpError(403, "Please, signin again to continue!");
      }

      authorizeCookie(res, authorizeId);
    }

    await generateAccess(res, userInfo);

    req.user = userInfo;
    return next();
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
      next();
    } catch (error: any) {
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

export { authAccess, authRefresh, upload, validate, delay, limiter };
