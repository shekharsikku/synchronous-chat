import { Request, Response } from "express";
import { ApiError, ApiResponse } from "../utils";
import {
  compareHash,
  generateHash,
  generateAccess,
  generateRefresh,
  authorizeCookie,
  maskedDetails,
  createAccessData,
  publicIpAddress,
} from "../helpers";
import User from "../models/user";
import env from "../utils/env";

const signUpUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = await req.body;

    const existsEmail = await User.findOne({ email });

    if (existsEmail) {
      throw new ApiError(409, "Email already exists!");
    }

    const hashedPassword = await generateHash(password);

    const newUser = await User.create({
      email,
      password: hashedPassword,
    });

    const userData = maskedDetails(newUser);
    return ApiResponse(res, 201, "Signed up successfully!", userData);
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

    const validatePassword = await compareHash(password, existsUser.password!);

    if (!validatePassword) {
      throw new ApiError(403, "Incorrect password!");
    }

    const accessData = createAccessData(existsUser);
    const accessToken = generateAccess(res, accessData);

    if (!accessData.setup) {
      const userData = maskedDetails(accessData);
      return ApiResponse(res, 200, "Please, complete your profile!", userData);
    }

    const refreshToken = generateRefresh(res, accessData._id!);
    const refreshExpiry = env.REFRESH_EXPIRY;
    const ipAddress = await publicIpAddress();

    existsUser.authentication?.push({
      token: refreshToken,
      expiry: new Date(Date.now() + refreshExpiry * 1000),
      device: ipAddress.ip,
    });

    const authorizeUser = await existsUser.save();
    const authorizeId = authorizeUser.authentication?.filter(
      (auth) => auth.token === refreshToken
    )[0]._id!;

    authorizeCookie(res, authorizeId.toString());

    return ApiResponse(res, 200, "Signed in successfully!", {
      _id: accessData._id,
      email: accessData.email,
      setup: accessData.setup,
    });
  } catch (error: any) {
    return ApiResponse(res, error.code, error.message);
  }
};

const signOutUser = async (req: Request, res: Response) => {
  const requestUser = req.user!;
  const refreshToken = req.cookies.refresh;
  const authorizeId = req.cookies.session;

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
  res.clearCookie("session");

  const userData = maskedDetails(requestUser);
  return ApiResponse(res, 200, "Signed out successfully!", userData);
};

const refreshAuth = async (req: Request, res: Response) => {
  const refreshData = { user: req.user, token: req.token };
  return ApiResponse(res, 200, "Authentication refreshed!");
};

export { signUpUser, signInUser, signOutUser, refreshAuth };
