import { Response } from "express";

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
  error?: any;
};

const ApiResponse = (
  res: Response,
  code: number,
  message: string,
  data: any = null,
  error: any = null
) => {
  const success: boolean = code < 400 ? true : false;
  const response: ResponseType = { code, success, message };

  if (data) response.data = data;
  if (error) response.error = error;
  res.status(code).send({ ...response });
};

export { ApiError, ApiResponse };
