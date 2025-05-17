import type { UserInterface } from "../interface/index.js";
import type { Response } from "express";
import type { Types } from "mongoose";
import jwt from "jsonwebtoken";
import env from "../utils/env.js";

const generateAccess = (res: Response, user?: UserInterface) => {
  const accessExpiry = env.ACCESS_EXPIRY;

  const accessToken = jwt.sign({ user }, env.ACCESS_SECRET, {
    algorithm: "HS256",
    expiresIn: accessExpiry,
  });

  res.cookie("access", accessToken, {
    maxAge: accessExpiry * 1000,
    httpOnly: true,
    sameSite: "strict",
    secure: env.isProd,
  });

  return accessToken;
};

const generateRefresh = (res: Response, uid: Types.ObjectId) => {
  const refreshExpiry = env.REFRESH_EXPIRY;

  const refreshToken = jwt.sign({ uid }, env.REFRESH_SECRET, {
    algorithm: "HS512",
    expiresIn: refreshExpiry,
  });

  res.cookie("refresh", refreshToken, {
    maxAge: refreshExpiry * 1000 * 2,
    httpOnly: true,
    sameSite: "strict",
    secure: env.isProd,
  });

  return refreshToken;
};

const authorizeCookie = (res: Response, authId: string) => {
  const authExpiry = env.REFRESH_EXPIRY;

  res.cookie("current", authId, {
    maxAge: authExpiry * 1000 * 2,
    httpOnly: true,
    sameSite: "strict",
    secure: env.isProd,
  });
};

const hasEmptyField = (fields: object) => {
  return Object.values(fields).some(
    (value) => value === "" || value === undefined || value === null
  );
};

const createUserInfo = (user: UserInterface) => {
  let userInfo;

  if (user.setup) {
    userInfo = {
      ...user.toObject(),
      password: undefined,
      authentication: undefined,
    };
  } else {
    userInfo = {
      _id: user._id,
      email: user.email,
      setup: user.setup,
    };
  }

  return userInfo as UserInterface;
};

export {
  generateAccess,
  generateRefresh,
  authorizeCookie,
  hasEmptyField,
  createUserInfo,
};
