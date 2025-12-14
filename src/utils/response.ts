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

const ErrorResponse = <E = any>(
  res: Response,
  code: number,
  message: string,
  error?: E
): Response<TypeResponse<undefined, E>> => {
  const response: TypeResponse<undefined, E> = { success: false, message };
  if (error !== undefined) response.error = error;
  return res.status(code).json(response);
};

const SuccessResponse = <T = any>(
  res: Response,
  code: number,
  message: string,
  data?: T
): Response<TypeResponse<T, undefined>> => {
  const response: TypeResponse<T, undefined> = { success: true, message };
  if (data !== undefined) response.data = data;
  return res.status(code).json(response);
};

export { HttpError, ErrorResponse, SuccessResponse };
