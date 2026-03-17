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

type TypeResponse<T = unknown, E = unknown> =
  | { success: true; message: string; data?: T }
  | { success: false; message: string; error?: E };

const ErrorResponse = <E>(
  res: Response,
  code: number,
  message: string,
  error?: E
): Response<TypeResponse<never, E>> => {
  const response: TypeResponse<never, E> = { success: false, message };
  if (error !== undefined) response.error = error;
  return res.status(code).json(response);
};

const SuccessResponse = <T>(
  res: Response,
  code: number,
  message: string,
  data?: T
): Response<TypeResponse<T, never>> => {
  const response: TypeResponse<T, never> = { success: true, message };
  if (data !== undefined) response.data = data;
  return res.status(code).json(response);
};

export { HttpError, ErrorResponse, SuccessResponse };
