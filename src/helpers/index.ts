import { NextFunction, Request, Response } from "express";
import { genSalt, hash, compare } from "bcryptjs";
import { ZodSchema } from "zod";
import { Types } from "mongoose";
import jwt from "jsonwebtoken";
import env from "../utils/env";
import { UserTokenInterface } from "../interface";
import { ApiResponse, ValidationError } from "../utils";

const generateHash = async (password: string): Promise<string> => {
  const salt = await genSalt(12);
  const hashed = await hash(password, salt);
  return hashed;
};

const compareHash = async (
  password: string,
  hashed: string
): Promise<boolean> => {
  const checked = await compare(password, hashed);
  return checked;
};

const validateSchema =
  (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error: any) {
      const errors = ValidationError(error);
      return ApiResponse(req, res, 400, errors[0].message);
    }
  };

const generateToken = (
  _req: Request,
  res: Response,
  _id: Types.ObjectId,
  setup?: boolean
): UserTokenInterface => {
  const accessExpiry = parseInt(env.ACCESS_TOKEN_EXPIRY);

  const access = jwt.sign({ _id }, env.ACCESS_TOKEN_SECRET, {
    algorithm: "HS256",
    expiresIn: accessExpiry,
  });

  res.cookie("access", access, {
    maxAge: parseInt(env.ACCESS_COOKIE_EXPIRY),
    httpOnly: true,
    sameSite: "strict",
    secure: env.NODE_ENV !== "development",
  });

  if (!setup) {
    const refresh = jwt.sign({ _id }, env.REFRESH_TOKEN_SECRET, {
      algorithm: "HS256",
      expiresIn: parseInt(env.REFRESH_TOKEN_EXPIRY),
      notBefore: accessExpiry - 720,
    });

    res.cookie("refresh", refresh, {
      maxAge: parseInt(env.REFRESH_COOKIE_EXPIRY),
      httpOnly: true,
      sameSite: "strict",
      secure: env.NODE_ENV !== "development",
    });

    return { access, refresh };
  }

  return { access };
};

const hasEmptyField = (fields: object) => {
  return Object.values(fields).some(
    (value) => value === "" || value === undefined
  );
};

const removeSpaces = (str: string) => {
  return str.replace(/\s+/g, "");
};

export {
  generateHash,
  compareHash,
  validateSchema,
  generateToken,
  hasEmptyField,
  removeSpaces,
};
