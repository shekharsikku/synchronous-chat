import type { UserInterface } from "@interface/index.js";
import type { Response } from "express";
import type { Types } from "mongoose";
import { createSecretKey, createHash } from "crypto";
import { CompactEncrypt, SignJWT } from "jose";
import { deflateSync } from "zlib";
import env from "@utils/env.js";

const generateSecret = async () => {
  return createSecretKey(createHash("sha256").update(env.ACCESS_SECRET).digest());
};

const generateAccess = async (res: Response, user?: UserInterface) => {
  const accessExpiry = env.ACCESS_EXPIRY;

  const accessPayload = deflateSync(JSON.stringify(user));
  const accessSecret = await generateSecret();

  const accessToken = await new CompactEncrypt(accessPayload)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .encrypt(accessSecret);

  res.cookie("access", accessToken, {
    maxAge: accessExpiry * 1000,
    httpOnly: true,
    sameSite: "strict",
    secure: env.isProd,
  });

  return accessToken;
};

const generateRefresh = async (res: Response, uid: Types.ObjectId) => {
  const refreshExpiry = env.REFRESH_EXPIRY;
  const refreshSecret = new TextEncoder().encode(env.REFRESH_SECRET);

  const refreshToken = await new SignJWT({ uid: uid.toString() })
    .setProtectedHeader({ alg: "HS512" })
    .setIssuedAt()
    .setExpirationTime(`${refreshExpiry}sec`)
    .sign(refreshSecret);

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
  return Object.values(fields).some((value) => value === "" || value === undefined || value === null);
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

export { generateSecret, generateAccess, generateRefresh, authorizeCookie, hasEmptyField, createUserInfo };
