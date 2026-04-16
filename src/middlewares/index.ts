import { inflateSync } from "node:zlib";
import { rateLimit } from "express-rate-limit";
import { compactDecrypt } from "jose";
import multer from "multer";
import pino from "pino";
import env from "#/utils/env.js";
import { ZodError, type ZodType } from "zod";
import { ApiError, ApiResponse, generateSecret, asyncMiddleware } from "#/utils/helpers.js";
import type { UserInterface } from "#/interfaces/index.js";
import type { NextFunction, Request, Response } from "express";

const authorizeAccess = async (req: Request): Promise<UserInterface> => {
  const accessToken = req.cookies["access"];
  if (!accessToken) throw new Error("No access token available!");

  const accessSecret = await generateSecret();
  const decryptedAccess = await compactDecrypt(accessToken, accessSecret);
  return JSON.parse(inflateSync(decryptedAccess.plaintext).toString());
};

export const authAccess = asyncMiddleware(async (req, _res, next) => {
  try {
    req.user = await authorizeAccess(req);
    return next();
  } catch {
    throw new ApiError(401, "Unauthorized access request!");
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
  (req: Request<{}, {}, T>, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      return next();
    } catch (error: any) {
      let response = new ApiResponse(400, "Validation error occurred!", { error });
      if (error instanceof ZodError && error.name === "ZodError") {
        response.error = JSON.parse(error.message);
      }
      return response.send(res);
    }
  };

/** Rate Limiter */
export const limiter = (minute = 10, limit = 1000) => {
  return rateLimit({
    windowMs: minute * 60 * 1000,
    limit: limit,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request, _res: Response) => {
      return req.clientIp!;
    },
    handler: (req: Request, _res: Response, _next: NextFunction) => {
      req.log.error(`Rate limit exceeded for IP: ${req.clientIp}`);
      throw new ApiError(429, "Maximum number of requests exceeded!");
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
