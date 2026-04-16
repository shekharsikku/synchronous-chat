import { genSalt, hash, compare } from "bcryptjs";
import { Types } from "mongoose";

import { revokeToken } from "#/middlewares/index.js";
import { User } from "#/models/index.js";
import env from "#/utils/env.js";
import { cookieOptions, generateAccess, generateRefresh, createUserInfo, generateHash } from "#/utils/helpers.js";
import { HttpError, HttpHandler } from "#/utils/response.js";

import type { SignUp, SignIn } from "#/utils/schema.js";

export const signUpUser = HttpHandler.wrap<{}, {}, SignUp>(async (req, res) => {
  const { email, password } = req.body;

  const existsEmail = await User.exists({ email });

  if (existsEmail) {
    throw new HttpError(409, "Email already exists!");
  }

  const hashSalt = await genSalt(12);
  const hashedPassword = await hash(password, hashSalt);

  await User.create({ email, password: hashedPassword });

  return HttpHandler.success(res, 201, "Signed up successfully!");
});

export const signInUser = HttpHandler.wrap<{}, {}, SignIn>(async (req, res) => {
  const deviceId = req.headers["x-device-id"] as string;
  const { email, password, username } = req.body;
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
    return HttpHandler.success(res, 200, "Please, complete your profile!", userInfo);
  }

  const authorizeId = new Types.ObjectId();
  const refreshToken = await generateRefresh(res, userInfo._id!, authorizeId, deviceId);
  const hashedRefresh = await generateHash(refreshToken);
  const refreshExpiry = new Date(Date.now() + env.REFRESH_EXPIRY * 1000);

  existsUser.authentication?.push({
    _id: authorizeId,
    token: hashedRefresh,
    expiry: refreshExpiry,
  });

  await existsUser.save();

  return HttpHandler.success(res, 200, "Signed in successfully!", userInfo);
});

export const signOutUser = HttpHandler.wrap(async (req, res) => {
  const currentAuthKey = req.cookies["current"];

  if (currentAuthKey) {
    await revokeToken(res, currentAuthKey);
  }

  res.clearCookie("access", cookieOptions);
  res.clearCookie("refresh", cookieOptions);
  res.clearCookie("current", cookieOptions);

  return HttpHandler.success(res, 200, "Signed out successfully!");
});
