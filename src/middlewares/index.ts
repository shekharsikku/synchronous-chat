import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { UserTokenInterface } from "../interface";
import { ApiError, ApiResponse } from "../utils";
import { generateToken } from "../helpers";
import User from "../models/user";
import env from "../utils/env";
import multer from "multer";

const accessToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const accessToken = req.cookies.access;

    if (!accessToken) {
      throw new ApiError(401, "Unauthorized access request!");
    }

    const decodedPayload = jwt.verify(
      accessToken,
      env.ACCESS_TOKEN_SECRET
    ) as JwtPayload;

    const accessUser = await User.findById(decodedPayload._id).select(
      "+refreshToken"
    );

    if (!decodedPayload || !accessUser) {
      throw new ApiError(403, "Invalid access request!");
    }

    const authTokens: UserTokenInterface = {
      access: accessToken,
      refresh: accessUser.refreshToken,
    };

    req.token = authTokens;
    req.user = accessUser;
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return ApiResponse(req, res, 401, "Access expired refresh required!!");
    }
    return ApiResponse(req, res, error.code, error.message);
  }
};

const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const refreshToken = req.cookies.refresh;

    if (!refreshToken) {
      throw new ApiError(401, "Unauthorized refresh request!");
    }

    const decodedPayload = jwt.verify(
      refreshToken,
      env.REFRESH_TOKEN_SECRET
    ) as JwtPayload;

    const refreshUser = await User.findById(decodedPayload?._id).select(
      "+refreshToken"
    );

    if (
      !decodedPayload ||
      !refreshUser ||
      refreshToken !== refreshUser?.refreshToken
    ) {
      throw new ApiError(401, "Invalid refresh request!");
    }

    const { access, refresh } = generateToken(
      req,
      res,
      refreshUser._id,
      refreshUser.profileSetup
    );

    refreshUser.refreshToken = refresh;
    await refreshUser.save({ validateBeforeSave: false });

    const authTokens: UserTokenInterface = { access, refresh };
    req.token = authTokens;
    next();
  } catch (error: any) {
    return ApiResponse(req, res, error.code, error.message);
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

export { accessToken, refreshToken, upload };
