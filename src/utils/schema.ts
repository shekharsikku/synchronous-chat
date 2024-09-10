import { z } from "zod";

export const signUpSchema = z.object({
  email: z
    .string({
      required_error: "Email required!",
      invalid_type_error: "Invalid email type!",
    })
    .email({ message: "Invalid email format!" }),
  password: z
    .string({
      required_error: "Password required!",
      invalid_type_error: "Invalid password type!",
    })
    .min(6, { message: "Password too short!" }),
  username: z
    .string({ invalid_type_error: "Invalid username type!" })
    .toLowerCase()
    .min(3, { message: "Username too short!" })
    .max(15, { message: "Username too long!" })
    .optional(),
});

export const signInSchema = z
  .object({
    email: z
      .string({ invalid_type_error: "Invalid email type!" })
      .email({ message: "Invalid email format!" })
      .optional(),
    username: z
      .string({ invalid_type_error: "Invalid username type!" })
      .optional(),
    password: z.string({
      required_error: "Password required!",
      invalid_type_error: "Invalid password type!",
    }),
  })
  .refine((data) => data.username || data.email, {
    message: "Email or Username required!",
    path: ["email", "username"],
  });

export const profileSetupSchema = z
  .object({
    fullName: z
      .string({ invalid_type_error: "Invalid fullName type!" })
      .min(3, { message: "FullName too short!" })
      .max(30, { message: "FullName too long!" })
      .optional(),
    username: z
      .string({ invalid_type_error: "Invalid username type!" })
      .toLowerCase()
      .min(3, { message: "Username too short!" })
      .max(15, { message: "Username too long!" })
      .optional(),
    profileColor: z
      .string({ invalid_type_error: "ProfileColor must be string!" })
      .optional(),
  })
  .refine(
    (data) => {
      return (
        data.fullName !== undefined ||
        data.username !== undefined ||
        data.profileColor !== undefined
      );
    },
    {
      message: "Details required for profile setup!",
      path: ["fullName", "username", "imageUrl", "profileColor"],
    }
  );