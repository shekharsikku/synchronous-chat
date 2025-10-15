import * as z from "zod";

export const SignUpSchema = z.object({
  email: z.email({ error: "Invalid email address!" }),
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters long!" })
    .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/, {
      error: "Password must have an uppercase, a lowercase letter, and a number!",
    })
    .refine((val) => !/\s/.test(val), {
      error: "Password cannot contain spaces!",
    }),
});

export const SignInSchema = z
  .object({
    email: z.email().optional(),
    username: z.string().optional(),
    password: z.string(),
  })
  .refine((data) => data.email || data.username, {
    error: "Email or Username required!",
    path: ["email", "username"],
  });

export const ProfileSchema = z.object({
  name: z.string().min(3).max(30),
  username: z
    .string()
    .min(3)
    .max(15)
    .regex(/^[a-z0-9_-]{3,15}$/, {
      error:
        "Only lowercase letters, numbers, hyphens, and underscores are allowed, with no spaces or special characters at the start/end!",
    }),
  gender: z.enum(["Male", "Female", "Other"]),
  bio: z.string(),
});

export const PasswordSchema = z.object({
  old_password: z.string(),
  new_password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters long!" })
    .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/, {
      error: "Password must have an uppercase, a lowercase letter, and a number!",
    })
    .refine((val) => !/\s/.test(val), {
      error: "Password cannot contain spaces!",
    }),
});

export const MessageSchema = z
  .object({
    type: z.enum(["text", "file"]),
    text: z.string().optional(),
    file: z.string().optional(),
    reply: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "text" && !data.text) {
      ctx.addIssue({
        path: ["text"],
        code: "custom",
        message: "Text is required when type is 'text'",
      });
    }

    if (data.type === "file" && !data.file) {
      ctx.addIssue({
        path: ["file"],
        code: "custom",
        message: "File is required when type is 'file'",
      });
    }
  });

export const TranslateSchema = z.object({
  message: z.string(),
  language: z.string(),
});

export const CreateGroupSchema = z.object({
  name: z.string().min(3).max(30),
  description: z.string().min(5).max(50),
  admin: z.string(),
  members: z
    .array(z.string().min(1))
    .min(1, { error: "Group must have at least one member!" })
    .max(10, { error: "Group cannot have more than 10 members!" }),
});

export const UpdateDetailsSchema = z.object({
  name: z.string().min(3).max(30).optional(),
  description: z.string().min(5).max(50).optional(),
});

export const UpdateMembersSchema = z.object({
  add: z.array(z.string().min(1)).default([]),
  remove: z.array(z.string().min(1)).default([]),
});

export type SignUp = z.infer<typeof SignUpSchema>;
export type SignIn = z.infer<typeof SignInSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
export type Password = z.infer<typeof PasswordSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type Translate = z.infer<typeof TranslateSchema>;
export type CreateGroupType = z.infer<typeof CreateGroupSchema>;
export type UpdateDetailsType = z.infer<typeof UpdateDetailsSchema>;
export type UpdateMembersType = z.infer<typeof UpdateMembersSchema>;
