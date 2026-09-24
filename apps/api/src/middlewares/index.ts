import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { verifyToken } from "#/utilities/tokens.js";
import { asyncHandler, HttpResponse } from "#/utilities/response.js";

const authorizeAccess = async (req: Request) => {
  const accessToken = req.cookies["access"];

  if (!accessToken) {
    throw new Error("No access token available!");
  }

  const { payload } = await verifyToken(accessToken, "access");

  return payload.uid;
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
