import { inflateSync } from "node:zlib";
import { rateLimit } from "express-rate-limit";
import { compactDecrypt } from "jose";
import multer from "multer";
import pino from "pino";
import env from "#/utilities/env.js";
import { accessSecret } from "#/utilities/crypto.js";
import type { UserInfo } from "#/utilities/helpers.js";
import { asyncMiddleware, HttpError } from "#/utilities/response.js";
import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

const authorizeAccess = async (req: Request): Promise<UserInfo> => {
  const accessToken = req.cookies["access"];
  if (!accessToken) throw new Error("No access token available!");

  const decryptedAccess = await compactDecrypt(accessToken, accessSecret);
  return JSON.parse(inflateSync(decryptedAccess.plaintext).toString());
};

export const authAccess = asyncMiddleware(async (req, _res, next) => {
  try {
    req.user = await authorizeAccess(req);
    return next();
  } catch {
    throw new HttpError(401, "Unauthorized request!");
  }
});

export const authEvents = asyncMiddleware(async (req, res, next) => {
  try {
    req.user = await authorizeAccess(req);
    return next();
  } catch {
    return res.sendStatus(401);
  }
});

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (_req, file, cb) {
    cb(null, file.originalname);
  },
});

/** Multer File Uploader */
export const upload = multer({ storage });

/** Zod Schema Validator */
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

/** Rate Limiter */
export const limiter = (minute = 10, limit = 10000) => {
  return rateLimit({
    windowMs: minute * 60 * 1000,
    limit: limit,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return req.clientIp!;
    },
    handler: (req) => {
      req.log.error("Rate limit exceeded for ip: %s", req.clientIp);
      throw new HttpError(429, "Maximum number of requests exceeded!");
    },
  });
};

const otherOptions = env.isDev ? { transport: { target: "pino-pretty", options: { colorize: true } } } : { base: null };

/** Pino Http Logger */
export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: ["req.headers.cookie", "res.headers['set-cookie']", "res.headers['content-security-policy']"],
    remove: true,
  },
  msgPrefix: "[SYNCHRONOUS] ",
  ...otherOptions,
});
