import { Response } from "express";

class HttpError extends Error {
  public code: number;
  public message: string;

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

const ErrorResponse = (
  res: Response,
  code: number,
  message: string,
  error: any = null
) => {
  const response: TypeResponse<null> = { success: false, message };

  if (error) response.error = error;
  res.status(code).json(response);
};

const SuccessResponse = (
  res: Response,
  code: number,
  message: string,
  data: any = null
) => {
  const response: TypeResponse<any, null> = { success: true, message };

  if (data) response.data = data;
  res.status(code).json(response);
};

export { HttpError, ErrorResponse, SuccessResponse };
