import type { RequestHandler, Response } from "express";

type SuccessStatusCode = 200 | 201 | 202 | 204;
type ErrorStatusCode = 400 | 401 | 403 | 404 | 409 | 413 | 422 | 429 | 500 | 502 | 503;

export class HttpError extends Error {
  constructor(
    public readonly code: ErrorStatusCode,
    message: string
  ) {
    super(message);
    this.name = new.target.name;
    Error.captureStackTrace(this, new.target);
  }
}

type SuccessResponse<T = unknown> = { success: true; message: string; data?: T };
type ErrorResponse<E = unknown> = { success: false; message: string; error?: E };

export class HttpResponse {
  static success<T>(res: Response, code: SuccessStatusCode, message: string, data?: T) {
    const response: SuccessResponse<T> = { success: true, message };
    if (data !== undefined) response.data = data;
    res.status(code).json(response);
  }

  static error<E>(res: Response, code: ErrorStatusCode, message: string, error?: E) {
    const response: ErrorResponse<E> = { success: false, message };
    if (error !== undefined) response.error = error;
    res.status(code).json(response);
  }
}

export const asyncHandler = <P, ResBody, ReqBody, ReqQuery>(
  fn: RequestHandler<P, ResBody, ReqBody, ReqQuery>
): RequestHandler<P, ResBody, ReqBody, ReqQuery> => {
  return (req, res, next) => {
    Promise.try(() => fn(req, res, next)).catch(next);
  };
};
