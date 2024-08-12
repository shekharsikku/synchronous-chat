import { Request, Response } from "express";
import { ZodError } from "zod";

class ApiError extends Error {
  public code: number;
  public message: string;
  
  constructor(code: number, message: string, stack: string = "") {
    super(message);
    this.code = code;
    this.message = message;
    this.stack = stack;
  }
}

type ResponseType = {
  code: number;
  success: boolean;
  message: string;
  data?: any;
};

const ApiResponse = (
  _req: Request,
  res: Response,
  code: number,
  message: string,
  data: any = null,
) => {
  const success: boolean = code < 400 ? true : false;
  const response: ResponseType = { code, success, message };

  if (data) response.data = data;
  return res.status(code).send({ ...response });
};

const ValidationError = (
  error: ZodError
): { path: string; message: string }[] => {
  return error.errors.map((err) => ({
    path: err.path.join(", "),
    message: err.message,
  }));
};

export { ApiError, ApiResponse, ValidationError };
