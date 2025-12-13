import type { Response } from "express";

class HttpError extends Error {
  public code: number;

  constructor(code: number, message: string, stack: string = "") {
    super(message);
    this.code = code;
    this.message = message;
    this.stack = stack;
  }
}

type TypeResponse<T = any, E = any> = {
  success: boolean;
  message: string;
  code?: number;
  data?: T;
  error?: E;
};

const ErrorResponse = <E>(res: Response, code: number, message: string, error?: E) => {
  const response: TypeResponse<undefined, E> = { success: false, message };
  if (error !== undefined) response.error = error;
  res.status(code).json(response);
};

const SuccessResponse = <T>(res: Response, code: number, message: string, data?: T) => {
  const response: TypeResponse<T, undefined> = { success: true, message };
  if (data !== undefined) response.data = data;
  res.status(code).json(response);
};

export { HttpError, ErrorResponse, SuccessResponse };
