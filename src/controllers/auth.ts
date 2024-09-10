import { Request, Response } from "express";
import { ApiError, ApiResponse } from "../utils";
import { UserSignUpInterface, UserSignInInterface } from "../interface";
import {
  compareHash,
  generateHash,
  generateToken,
  removeSpaces,
} from "../helpers";
import User from "../models/user";

const signUpUser = async (req: Request, res: Response) => {
  try {
    const { email, password, username } = await req.body;

    const existedUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existedUser) {
      let field: string;

      if (existedUser.email == email) {
        field = "Email";
      } else {
        field = "Username";
      }

      throw new ApiError(409, `${field} already exists!`);
    }

    const hashed = await generateHash(password);

    const userData: UserSignUpInterface = {
      email,
      password: hashed,
    };

    if (username) {
      userData.username = removeSpaces(username);
    }

    const newUser = new User(userData);
    const savedUser = await newUser.save();

    if (savedUser) {
      return ApiResponse(
        req,
        res,
        201,
        "Signed up successfully!",
        savedUser._id
      );
    }
    throw new ApiError(500, "Error while signup!");
  } catch (error: any) {
    return ApiResponse(req, res, error.code, error.message);
  }
};

const signInUser = async (req: Request, res: Response) => {
  try {
    const { email, password, username } = await req.body;

    const user = await User.findOne({
      $or: [{ email }, { username }],
    }).select("+password");

    if (!user) {
      throw new ApiError(404, "User not exists!");
    }

    const checked = await compareHash(password, user.password);

    if (!checked) {
      throw new ApiError(403, "Incorrect password!");
    }

    const data: UserSignInInterface = {
      _id: user._id,
      profileSetup: user.profileSetup,
    };

    if (user.profileSetup) {
      const { access } = generateToken(req, res, user._id, user.profileSetup);
      data.authToken = { access };
      return ApiResponse(req, res, 202, "Please, setup your profile!", data);
    }

    const { access, refresh } = generateToken(
      req,
      res,
      user._id,
      user.profileSetup
    );

    user.refreshToken = refresh;
    await user.save({ validateBeforeSave: false });
    data.authToken = { access, refresh };
    return ApiResponse(req, res, 200, "Signed in successfully!", data);
  } catch (error: any) {
    return ApiResponse(req, res, error.code, error.message);
  }
};

const signOutUser = async (req: Request, res: Response) => {
  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  res.clearCookie("access");
  res.clearCookie("refresh");
  return ApiResponse(req, res, 200, "Signed out successfully!");
};

const authRefresh = async (req: Request, res: Response) => {
  const tokens = req.token;
  return ApiResponse(
    req,
    res,
    200,
    "Auth tokens refresh successfully!",
    tokens
  );
};

export { signUpUser, signInUser, signOutUser, authRefresh };
