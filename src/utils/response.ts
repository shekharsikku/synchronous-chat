import type { NextFunction, Request, RequestHandler, Response } from "express";

export class HttpError extends Error {
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

export class HttpHandler {
  static wrap = <P = {}, ResBody = unknown, ReqBody = unknown, ReqQuery = {}>(
    func: RequestHandler<P, ResBody, ReqBody, ReqQuery>
  ): RequestHandler<P, ResBody, ReqBody, ReqQuery> => {
    return (req: Request<P, ResBody, ReqBody, ReqQuery>, res: Response<ResBody>, next: NextFunction) => {
      Promise.resolve(func(req, res, next)).catch(next);
    };
  };

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
