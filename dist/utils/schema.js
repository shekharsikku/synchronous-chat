"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranslateSchema = exports.MessageSchema = exports.PasswordSchema = exports.ProfileSchema = exports.SignInSchema = exports.SignUpSchema = void 0;
const zod_1 = require("zod");
exports.SignUpSchema = zod_1.z.object({
    email: zod_1.z.string().email({ message: "Invalid email address!" }),
    password: zod_1.z
        .string()
        .min(8, { message: "Password must be at least 8 characters long!" })
        .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/, {
        message: "Password must have an uppercase, a lowercase letter, and a number!",
    })
        .refine((val) => !/\s/.test(val), {
        message: "Password cannot contain spaces!",
    }),
});
exports.SignInSchema = zod_1.z
    .object({
    email: zod_1.z.string().email().optional(),
    username: zod_1.z.string().optional(),
    password: zod_1.z.string(),
})
    .refine((data) => data.email || data.username, {
    message: "Email or Username required!",
    path: ["email", "username"],
});
exports.ProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(3).max(30),
    username: zod_1.z
        .string()
        .min(3)
        .max(15)
        .regex(/^[a-z0-9_-]{3,15}$/, {
        message: "Only lowercase letters, numbers, hyphens, and underscores are allowed, with no spaces or special characters at the start/end!",
    }),
    gender: zod_1.z.enum(["Male", "Female", "Other"]),
    bio: zod_1.z.string(),
});
exports.PasswordSchema = zod_1.z.object({
    old_password: zod_1.z.string(),
    new_password: zod_1.z
        .string()
        .min(8, { message: "Password must be at least 8 characters long!" })
        .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/, {
        message: "Password must have an uppercase, a lowercase letter, and a number!",
    })
        .refine((val) => !/\s/.test(val), {
        message: "Password cannot contain spaces!",
    }),
});
exports.MessageSchema = zod_1.z
    .object({
    type: zod_1.z.enum(["text", "file"]),
    text: zod_1.z.string().optional(),
    file: zod_1.z.string().optional(),
})
    .superRefine((data, ctx) => {
    if (data.type === "text" && !data.text) {
        ctx.addIssue({
            path: ["text"],
            code: zod_1.z.ZodIssueCode.custom,
            message: "Text is required when type is 'text'",
        });
    }
    if (data.type === "file" && !data.file) {
        ctx.addIssue({
            path: ["file"],
            code: zod_1.z.ZodIssueCode.custom,
            message: "File is required when type is 'file'",
        });
    }
});
exports.TranslateSchema = zod_1.z.object({
    message: zod_1.z.string(),
    language: zod_1.z.string(),
});
