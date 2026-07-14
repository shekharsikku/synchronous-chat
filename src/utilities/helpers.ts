import { deflateSync } from "node:zlib";
import { CompactEncrypt, SignJWT } from "jose";
import type { UserDocument } from "#/models/index.js";
import type { CookieOptions, Response } from "express";
import type { Types } from "mongoose";
import { accessSecret, encryptAuth, refreshSecret } from "./crypto.js";
import env from "./env.js";

export type UserInfo =
  | Pick<UserDocument, "_id" | "name" | "email" | "username" | "image" | "setup">
  | Omit<UserDocument, "password" | "authentication">;

export const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: env.isProd,
};

export const generateAccess = async (res: Response, user?: UserInfo) => {
  const accessExpiry = env.ACCESS_EXPIRY;
  const accessPayload = deflateSync(JSON.stringify(user));

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
  const currentAuthKey = encryptAuth(uid.toString(), aid.toString());

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

export function formatBytes(bytes: number) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;

  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }

  return `${bytes.toFixed(2)} ${units[i]}`;
}

export function formatUptime(uptime = process.uptime()) {
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = uptime % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds.toFixed(2)}s`;
  }

  return `${minutes}m ${seconds.toFixed(2)}s`;
}
