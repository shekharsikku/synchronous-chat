import { z } from "zod";
export const SignUpSchema = z.object({
    email: z.string().email({ message: "Invalid email address!" }),
    password: z
        .string()
        .min(8, { message: "Password must be at least 8 characters long!" })
        .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/, {
        message: "Password must have an uppercase, a lowercase letter, and a number!",
    })
        .refine((val) => !/\s/.test(val), {
        message: "Password cannot contain spaces!",
    }),
});
export const SignInSchema = z
    .object({
    email: z.string().email().optional(),
    username: z.string().optional(),
    password: z.string(),
})
    .refine((data) => data.email || data.username, {
    message: "Email or Username required!",
    path: ["email", "username"],
});
export const ProfileSchema = z.object({
    name: z.string().min(3).max(30),
    username: z
        .string()
        .min(3)
        .max(15)
        .regex(/^[a-z0-9_-]{3,15}$/, {
        message: "Only lowercase letters, numbers, hyphens, and underscores are allowed, with no spaces or special characters at the start/end!",
    }),
    gender: z.enum(["Male", "Female", "Other"]),
    bio: z.string(),
});
export const PasswordSchema = z.object({
    old_password: z.string(),
    new_password: z
        .string()
        .min(8, { message: "Password must be at least 8 characters long!" })
        .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/, {
        message: "Password must have an uppercase, a lowercase letter, and a number!",
    })
        .refine((val) => !/\s/.test(val), {
        message: "Password cannot contain spaces!",
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
