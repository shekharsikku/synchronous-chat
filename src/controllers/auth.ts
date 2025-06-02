import type { Request, Response } from "express";
import type { SignUp, SignIn } from "../utils/schema.js";
import { genSalt, hash, compare } from "bcryptjs";
import { HttpError, ErrorResponse, SuccessResponse } from "../utils/index.js";
import {
  generateAccess,
  generateRefresh,
  authorizeCookie,
  createUserInfo,
} from "../utils/helpers.js";
import { User } from "../models/index.js";
import env from "../utils/env.js";

const signUpUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = (await req.body) as SignUp;

    const existsEmail = await User.exists({ email });

    if (existsEmail) {
      throw new HttpError(409, "Email already exists!");
    }

    const hashSalt = await genSalt(12);
    const hashedPassword = await hash(password, hashSalt);

    await User.create({ email, password: hashedPassword });

    return SuccessResponse(res, 201, "Signed up successfully!");
  } catch (error: any) {
    return ErrorResponse(
      res,
      error.code || 500,
      error.message || "Error while user signup!"
    );
  }
};

const signInUser = async (req: Request, res: Response) => {
  try {
    const { email, password, username } = (await req.body) as SignIn;
    const conditions = [];

    if (email) {
      conditions.push({ email });
    } else if (username) {
      conditions.push({ username });
    } else {
      throw new HttpError(400, "Email or Username required!");
    }

    const existsUser = await User.findOne({
      $or: conditions,
    }).select("+password +authentication");

    if (!existsUser) {
      throw new HttpError(404, "User not exists!");
    }

    const isCorrect = await compare(password, existsUser.password!);

    if (!isCorrect) {
      throw new HttpError(403, "Incorrect password!");
    }

    const userInfo = createUserInfo(existsUser);
    await generateAccess(res, userInfo);

    if (!userInfo.setup) {
      return SuccessResponse(
        res,
        200,
        "Please, complete your profile!",
        userInfo
      );
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

    return SuccessResponse(res, 200, "Signed in successfully!", userInfo);
  } catch (error: any) {
    return ErrorResponse(
      res,
      error.code || 500,
      error.message || "Error while user signin!"
    );
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

  return SuccessResponse(res, 200, "Signed out successfully!");
};

const refreshAuth = async (req: Request, res: Response) => {
  return SuccessResponse(res, 200, "Authentication refreshed!", req.user);
};

export { signUpUser, signInUser, signOutUser, refreshAuth };
