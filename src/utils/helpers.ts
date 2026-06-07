import { createSecretKey, createHash } from "node:crypto";
import { deflateSync } from "node:zlib";
import { CompactEncrypt, SignJWT } from "jose";
import env from "#/utils/env.js";
import type { UserDocument } from "#/models/index.js";
import type { CookieOptions, Response } from "express";
import type { Types } from "mongoose";

export type UserInfo =
  | Pick<UserDocument, "_id" | "name" | "email" | "username" | "setup">
  | Omit<UserDocument, "password" | "authentication">;

export const generateSecret = async () => {
  return createSecretKey(createHash("sha256").update(env.ACCESS_SECRET).digest());
};

export const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: env.isProd,
};

export const generateAccess = async (res: Response, user?: UserInfo) => {
  const accessExpiry = env.ACCESS_EXPIRY;

  const accessPayload = deflateSync(JSON.stringify(user));
  const accessSecret = await generateSecret();

  const accessToken = await new CompactEncrypt(accessPayload)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .encrypt(accessSecret);

  res.cookie("access", accessToken, {
    maxAge: accessExpiry * 1000,
    ...cookieOptions,
  });

  return accessToken;
};

export const generateRefresh = async (res: Response, uid: Types.ObjectId, aid: Types.ObjectId, jti: string) => {
  const refreshExpiry = env.REFRESH_EXPIRY;
  const refreshSecret = new TextEncoder().encode(env.REFRESH_SECRET);
  const currentAuthKey = `${uid.toString()}:${aid.toString()}`;

  const refreshToken = await new SignJWT({ uid: uid.toString() })
    .setProtectedHeader({ alg: "HS512" })
    .setIssuedAt()
    .setExpirationTime(`${refreshExpiry}sec`)
    .setJti(jti)
    .sign(refreshSecret);

  res.cookie("refresh", refreshToken, {
    maxAge: refreshExpiry * 1000 * 2,
    ...cookieOptions,
  });

  res.cookie("current", currentAuthKey, {
    maxAge: refreshExpiry * 1000 * 2,
    ...cookieOptions,
  });

  return refreshToken;
};

export const generateHash = async (token: string) => {
  return createHash("sha256").update(token).digest("hex");
};

export const hasEmptyField = (fields: object) => {
  return Object.values(fields).some((value) => value === "" || value === undefined || value === null);
};

export const createUserInfo = (user: UserDocument) => {
  if (!user.setup) {
    return {
      _id: user._id,
      email: user.email,
      setup: user.setup,
    };
  }
  // oxlint-disable-next-line no-unused-vars
  const { password, authentication, ...safeUser } = user.toObject();
  return safeUser;
};

export { asyncHandler, asyncMiddleware, HttpError as ApiError, HttpResponse as ApiResponse } from "#/utils/response.js";
