import type { NextFunction, Request, Response } from "express";
import type { UserInterface } from "../interface/index.js";
import type { ZodSchema } from "zod";
import type { Types } from "mongoose";
import type { JwtPayload } from "jsonwebtoken";
import { HttpError, ErrorResponse } from "../utils/index.js";
import {
  generateSecret,
  generateAccess,
  generateRefresh,
  authorizeCookie,
  createUserInfo,
} from "../utils/helpers.js";
import { User } from "../models/index.js";
import { compactDecrypt } from "jose";
import { inflateSync } from "zlib";
import jwt from "jsonwebtoken";
import env from "../utils/env.js";
import multer from "multer";

const authAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const accessToken = req.cookies.access;

    if (!accessToken) {
      throw new HttpError(401, "Unauthorized access request!");
    }

    let decodedPayload;

    try {
      const accessSecret = await generateSecret();
      const decrypted = await compactDecrypt(accessToken, accessSecret);
      decodedPayload = JSON.parse(inflateSync(decrypted.plaintext).toString());
    } catch (error: any) {
      throw new HttpError(403, "Invalid access request!");
    }

    req.user = decodedPayload as UserInterface;
    next();
  } catch (error: any) {
    return ErrorResponse(
      res,
      error.code || 500,
      error.message || "Something went wrong!"
    );
  }
};

const authRefresh = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const refreshToken = req.cookies.refresh;
    const authorizeId = req.cookies.current;

    if (!refreshToken || !authorizeId) {
      throw new HttpError(401, "Unauthorized refresh request!");
    }

    let decodedPayload;

    try {
      decodedPayload = jwt.verify(refreshToken, env.REFRESH_SECRET, {
        algorithms: ["HS512"],
        ignoreExpiration: true,
        ignoreNotBefore: true,
      }) as JwtPayload;
    } catch (error: any) {
      throw new HttpError(403, "Invalid refresh request!");
    }

    const userId = decodedPayload.uid as Types.ObjectId;
    const currentTime = Math.floor(Date.now() / 1000);
    const beforeExpires = decodedPayload.exp! - env.REFRESH_EXPIRY / 2;

    const requestUser = await User.findOne({
      _id: userId,
      authentication: {
        $elemMatch: {
          _id: authorizeId,
          token: refreshToken,
        },
      },
    });

    if (!requestUser) {
      throw new HttpError(403, "Invalid user request!");
    }

    const userInfo = createUserInfo(requestUser);

    if (currentTime >= beforeExpires && currentTime < decodedPayload.exp!) {
      const newRefreshToken = generateRefresh(res, userId);
      const refreshExpiry = env.REFRESH_EXPIRY;

      const updatedAuth = await User.updateOne(
        {
          _id: userId,
          authentication: {
            $elemMatch: { _id: authorizeId, token: refreshToken },
          },
        },
        {
          $set: {
            "authentication.$.token": newRefreshToken,
            "authentication.$.expiry": new Date(
              Date.now() + refreshExpiry * 1000
            ),
          },
        }
      );

      if (updatedAuth.modifiedCount > 0) {
        authorizeCookie(res, authorizeId);
        await generateAccess(res, userInfo);
      } else {
        throw new HttpError(403, "Invalid refresh request!");
      }
    } else if (currentTime >= decodedPayload.exp!) {
      await User.updateOne(
        { _id: userId },
        {
          $pull: {
            authentication: { _id: authorizeId, token: refreshToken },
          },
        }
      );

      res.clearCookie("access");
      res.clearCookie("refresh");
      res.clearCookie("current");

      throw new HttpError(401, "Please, login again to continue!");
    } else {
      await generateAccess(res, userInfo);
    }

    req.user = userInfo;
    next();
  } catch (error: any) {
    return ErrorResponse(
      res,
      error.code || 500,
      error.message || "Something went wrong!"
    );
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
  <T>(schema: ZodSchema<T>) =>
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

export { authAccess, authRefresh, upload, validate, delay };
