import { inflateSync } from "node:zlib";
import { compactDecrypt } from "jose";

import { accessSecret } from "#/utilities/crypto.js";
import type { UserInfo } from "#/utilities/helpers.js";
import { asyncHandler, HttpResponse } from "#/utilities/response.js";
import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

const authorizeAccess = async (req: Request): Promise<UserInfo> => {
  const accessToken = req.cookies["access"];
  if (!accessToken) throw new Error("No access token available!");

  const { plaintext } = await compactDecrypt(accessToken, accessSecret);
  return JSON.parse(inflateSync(plaintext).toString());
};

export const authAccess = asyncHandler(async (req, res, next) => {
  try {
    req.user = await authorizeAccess(req);
    return next();
  } catch {
    return HttpResponse.error(res, 401, "Unauthorized request!");
  }
});

export const authEvents = asyncHandler(async (req, res, next) => {
  try {
    req.user = await authorizeAccess(req);
    return next();
  } catch {
    return res.sendStatus(401);
  }
});

export const validate =
  <T>(schema: ZodType<T>) =>
  (req: Request<{}, {}, T>, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      return next();
    } catch (err) {
      return next(err);
    }
  };
