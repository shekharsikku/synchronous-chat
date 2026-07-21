import { deflateSync } from "node:zlib";
import { CompactEncrypt, SignJWT } from "jose";
import type { UserDocument } from "#/models/index.js";
import type { CookieOptions, Response } from "express";
import type { Types } from "mongoose";
import { accessSecret, encryptAuth, refreshSecret } from "./crypto.js";
import env from "./env.js";

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
      name: user.name ?? null,
      username: user.username ?? null,
      setup: user.setup,
    };
  }
  return {
    _id: user._id,
    email: user.email,
    name: user.name ?? null,
    username: user.username ?? null,
    gender: user.gender ?? null,
    image: user.image ?? null,
    bio: user.bio ?? null,
    setup: user.setup,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

export type UserInfo = ReturnType<typeof createUserInfo>;

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
