import { createSecretKey, createHash } from "node:crypto";
import { deflateSync } from "node:zlib";
import { CompactEncrypt, SignJWT } from "jose";
import env from "#/utils/env.js";
import type { UserInterface } from "#/interfaces/index.js";
import type { CookieOptions, NextFunction, Request, RequestHandler, Response } from "express";
import type { Types } from "mongoose";

export const generateSecret = async () => {
  return createSecretKey(createHash("sha256").update(env.ACCESS_SECRET).digest());
};

export const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: env.isProd,
};

export const generateAccess = async (res: Response, user?: UserInterface) => {
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

export const createUserInfo = (user: UserInterface) => {
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

export const asyncHandler = <P = {}, ResBody = unknown, ReqBody = unknown, ReqQuery = {}>(
  func: RequestHandler<P, ResBody, ReqBody, ReqQuery>
): RequestHandler<P, ResBody, ReqBody, ReqQuery> => {
  return (req: Request<P, ResBody, ReqBody, ReqQuery>, res: Response<ResBody>, next: NextFunction) => {
    Promise.resolve(func(req, res, next)).catch(next);
  };
};

export class ApiError extends Error {
  public code: number;

  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

type TypeResponse<T = unknown, E = unknown> =
  | { success: true; message: string; data?: T }
  | { success: false; message: string; error?: E };

export class ApiResponse {
  static success = <T>(res: Response, code: number, message: string, data?: T): Response<TypeResponse<T, never>> => {
    const response: TypeResponse<T, never> = { success: true, message };
    if (data !== undefined) response.data = data;
    return res.status(code).json(response);
  };

  static error = <E>(res: Response, code: number, message: string, error?: E): Response<TypeResponse<never, E>> => {
    const response: TypeResponse<never, E> = { success: false, message };
    if (error !== undefined) response.error = error;
    return res.status(code).json(response);
  };
}
