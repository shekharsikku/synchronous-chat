import * as z from "zod";

export const signUpSchema = z
  .object({
    email: z.email({ error: "Invalid email address!" }),
    password: z
      .string()
      .min(8, { error: "Password must be at least 8 characters long!" })
      .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/, {
        error: "Password ust have an uppercase, a lowercase letter, and a number!",
      })
      .refine((val) => !/\s/.test(val), {
        error: "Password cannot contain spaces!",
      }),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    error: "Confirm password not matching!",
    path: ["confirm"],
  });

export const signInSchema = z.object({
  credential: z
    .string()
    .min(1, { error: "Email or Username is required!" })
    .transform((val) => val.replace(/\s+/g, "")),
  password: z.string().min(1, { error: "Password is required!" }),
});

export const changePasswordSchema = z
  .object({
    old_password: z.string().min(1, { error: "Old password is required!" }),
    new_password: z
      .string()
      .min(8, { error: "New password must be at least 8 characters long!" })
      .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/, {
        error: "Must have an uppercase, a lowercase letter, and a number!",
      })
      .refine((val) => !/\s/.test(val), {
        error: "Password cannot contain spaces!",
      }),
    confirm_password: z.string().min(8, {
      error: "Confirm password must be at least 8 characters long!",
    }),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    error: "Confirm password is not matching with new password!",
    path: ["confirm_password"],
  });

export const genders = ["Male", "Female", "Other"] as const;

export const profileUpdateSchema = z.object({
  name: z
    .string()
    .min(3, { error: "Name must be at least 3 characters long!" })
    .max(30, { error: "Name can be maximum 30 characters long!" }),
  username: z
    .string()
    .min(3, { error: "Username must be at least 3 characters long!" })
    .max(15, { error: "Username can be maximum 15 characters long!" })
    .regex(/^[a-z0-9_-]{3,15}$/, {
      error:
        "Only lowercase letters, numbers, hyphens, and underscores are allowed, with no spaces or special characters at the start/end!",
    }),
  gender: z.enum(genders),
  bio: z.string(),
});
