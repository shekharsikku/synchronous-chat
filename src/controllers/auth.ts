import { Request, Response } from "express";
import { genSalt, hash, compare } from "bcryptjs";
import { ApiError, ApiResponse } from "../utils";
import {
  generateAccess,
  generateRefresh,
  authorizeCookie,
  createUserInfo,
} from "../helpers";
import User from "../models/user";
import env from "../utils/env";

const signUpUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = await req.body;

    const existsEmail = await User.exists({ email });

    if (existsEmail) {
      throw new ApiError(409, "Email already exists!");
    }

    const hashSalt = await genSalt(12);
    const hashedPassword = await hash(password, hashSalt);

    await User.create({ email, password: hashedPassword });

    return ApiResponse(res, 201, "Signed up successfully!");
  } catch (error: any) {
    return ApiResponse(res, error.code, error.message);
  }
};

const signInUser = async (req: Request, res: Response) => {
  try {
    const { email, password, username } = await req.body;
    const conditions = [];

    if (email) {
      conditions.push({ email });
    } else if (username) {
      conditions.push({ username });
    } else {
      throw new ApiError(400, "Email or Username required!");
    }

    const existsUser = await User.findOne({
      $or: conditions,
    }).select("+password +authentication");

    if (!existsUser) {
      throw new ApiError(404, "User not exists!");
    }

    const isCorrect = await compare(password, existsUser.password!);

    if (!isCorrect) {
      throw new ApiError(403, "Incorrect password!");
    }

    const userInfo = createUserInfo(existsUser);
    generateAccess(res, userInfo);

    if (!userInfo.setup) {
      return ApiResponse(res, 200, "Please, complete your profile!", userInfo);
    }

    const refreshToken = generateRefresh(res, userInfo._id!);
    const refreshExpiry = env.REFRESH_EXPIRY;

    existsUser.authentication?.push({
      token: refreshToken,
      expiry: new Date(Date.now() + refreshExpiry * 1000),
    });

    const authorizeUser = await existsUser.save();
    const authorizeId = authorizeUser.authentication?.find(
      (auth) => auth.token === refreshToken
    )?._id!;

    authorizeCookie(res, authorizeId.toString());

    return ApiResponse(res, 200, "Signed in successfully!", userInfo);
  } catch (error: any) {
    return ApiResponse(res, error.code, error.message);
  }
};

const signOutUser = async (req: Request, res: Response) => {
  const requestUser = req.user!;
  const refreshToken = req.cookies.refresh;
  const authorizeId = req.cookies.current;

  if (requestUser.setup && refreshToken && authorizeId) {
    await User.updateOne(
      { _id: requestUser._id },
      {
        $pull: {
          authentication: { _id: authorizeId, token: refreshToken },
        },
      }
    );
  }

  res.clearCookie("access");
  res.clearCookie("refresh");
  res.clearCookie("current");

  return ApiResponse(res, 200, "Signed out successfully!");
};

const refreshAuth = async (req: Request, res: Response) => {
  return ApiResponse(res, 200, "Authentication refreshed!", req.user);
};

export { signUpUser, signInUser, signOutUser, refreshAuth };
