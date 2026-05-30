import type { NextFunction, Request, Response } from "express";

type SuccessStatusCode = 200 | 201 | 202 | 204;
type ErrorStatusCode = 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500 | 502 | 503;

export class HttpError extends Error {
  public readonly code: ErrorStatusCode;

  constructor(code: ErrorStatusCode, message: string) {
    super(message);
    this.code = code;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class HttpResponse<T = unknown, E = unknown> {
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
  ) => HttpResponse | Promise<HttpResponse>
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
