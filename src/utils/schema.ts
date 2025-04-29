import { NextFunction, Request, Response } from "express";
import { z, ZodSchema, ZodError } from "zod";
import { ApiResponse } from "../utils";

const ValidationError = (
  error: ZodError
): { path: string; message: string }[] => {
  return error.errors.map((err) => ({
    path: err.path.join(", "),
    message: err.message,
  }));
};

const validateSchema =
  (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error: any) {
      const errors = ValidationError(error);
      return ApiResponse(res, 400, "Validation Error!", null, errors);
    }
  };

const signUpSchema = z.object({
  email: z.string().email({ message: "Invalid email address!" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" })
    .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/, {
      message:
        "Password must have an uppercase, a lowercase letter, and a number!",
    })
    .refine((val) => !/\s/.test(val), {
      message: "Password cannot contain spaces!",
    }),
});

const signInSchema = z
  .object({
    email: z.string().email().optional(),
    username: z.string().optional(),
    password: z.string(),
  })
  .refine((data) => data.email || data.username, {
    message: "Email or Username required!",
    path: ["email", "username"],
  });

const profileSchema = z.object({
  name: z.string().min(3).max(30),
  username: z
    .string()
    .min(3)
    .max(15)
    .regex(/^[a-z0-9_-]{3,15}$/, {
      message:
        "Only lowercase letters, numbers, hyphens, and underscores are allowed, with no spaces or special characters at the start/end!",
    }),
  gender: z.enum(["Male", "Female", "Other"]),
  bio: z.string(),
});

const passwordSchema = z.object({
  old_password: z.string(),
  new_password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" })
    .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/, {
      message:
        "Password must have an uppercase, a lowercase letter, and a number!",
    })
    .refine((val) => !/\s/.test(val), {
      message: "Password cannot contain spaces!",
    }),
});

export {
  validateSchema,
  signUpSchema,
  signInSchema,
  profileSchema,
  passwordSchema,
};
