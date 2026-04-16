import { createSecretKey, createHash } from "node:crypto";
import { deflateSync } from "node:zlib";
import { CompactEncrypt, SignJWT } from "jose";
import env from "#/utils/env.js";
import type { UserInterface } from "#/interfaces/index.js";
import type { CookieOptions, NextFunction, Request, Response } from "express";
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

type SuccessStatusCode = 200 | 201 | 202 | 204;
type ErrorStatusCode = 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500 | 502 | 503;

export class ApiError extends Error {
  public readonly code: ErrorStatusCode;

  constructor(code: ErrorStatusCode, message: string) {
    super(message);
    this.code = code;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ApiResponse<T = unknown, E = unknown> {
  private code: SuccessStatusCode | ErrorStatusCode;
  private success: boolean;
  private message: string;
  public data?: T | undefined;
  public error?: E | undefined;

  constructor(code: SuccessStatusCode | ErrorStatusCode, message: string);
  constructor(code: SuccessStatusCode, message: string, options?: { data?: T });
  constructor(code: ErrorStatusCode, message: string, options?: { error?: E });

  constructor(code: SuccessStatusCode | ErrorStatusCode, message: string, options?: { data?: T; error?: E }) {
    this.code = code;
    this.success = code < 400;
    this.message = message;

    if (this.success) {
      if (options?.error !== undefined) {
        throw new Error("Cannot set error for success response!");
      }
      this.data = options?.data;
    } else {
      if (options?.data !== undefined) {
        throw new Error("Cannot set data for error response!");
      }
      this.error = options?.error;
    }
  }

  private toJSON() {
    return {
      success: this.success,
      message: this.message,
      data: this.data,
      error: this.error,
    };
  }

  public send(res: Response) {
    return res.status(this.code).json(this.toJSON());
  }
}

export const asyncHandler = <P = {}, ResBody = unknown, ReqBody = unknown, ReqQuery = {}>(
  func: (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody>,
    next: NextFunction
  ) => ApiResponse | Promise<ApiResponse>
) => {
  return async (req: Request<P, ResBody, ReqBody, ReqQuery>, res: Response<ResBody>, next: NextFunction) => {
    try {
      const response = await func(req, res, next);
      return response.send(res);
    } catch (err) {
      return next(err);
    }
  };
};

export const asyncMiddleware = <P = {}, ResBody = unknown, ReqBody = unknown, ReqQuery = {}>(
  func: (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody>,
    next: NextFunction
  ) => void | Response | Promise<void | Response>
) => {
  return async (req: Request<P, ResBody, ReqBody, ReqQuery>, res: Response<ResBody>, next: NextFunction) => {
    try {
      return await func(req, res, next);
    } catch (err) {
      return next(err);
    }
  };
};
