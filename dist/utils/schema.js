"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileSetupSchema = exports.signInSchema = exports.signUpSchema = void 0;
const zod_1 = require("zod");
exports.signUpSchema = zod_1.z.object({
    email: zod_1.z
        .string({
        required_error: "Email required!",
        invalid_type_error: "Invalid email type!",
    })
        .email({ message: "Invalid email format!" }),
    password: zod_1.z
        .string({
        required_error: "Password required!",
        invalid_type_error: "Invalid password type!",
    })
        .min(6, { message: "Password too short!" }),
    username: zod_1.z
        .string({ invalid_type_error: "Invalid username type!" })
        .toLowerCase()
        .min(3, { message: "Username too short!" })
        .max(15, { message: "Username too long!" })
        .optional(),
});
exports.signInSchema = zod_1.z
    .object({
    email: zod_1.z
        .string({ invalid_type_error: "Invalid email type!" })
        .email({ message: "Invalid email format!" })
        .optional(),
    username: zod_1.z
        .string({ invalid_type_error: "Invalid username type!" })
        .optional(),
    password: zod_1.z.string({
        required_error: "Password required!",
        invalid_type_error: "Invalid password type!",
    }),
})
    .refine((data) => data.username || data.email, {
    message: "Email or Username required!",
    path: ["email", "username"],
});
exports.profileSetupSchema = zod_1.z
    .object({
    fullName: zod_1.z
        .string({ invalid_type_error: "Invalid fullName type!" })
        .min(3, { message: "FullName too short!" })
        .max(30, { message: "FullName too long!" })
        .optional(),
    username: zod_1.z
        .string({ invalid_type_error: "Invalid username type!" })
        .toLowerCase()
        .min(3, { message: "Username too short!" })
        .max(15, { message: "Username too long!" })
        .optional(),
    profileColor: zod_1.z
        .string({ invalid_type_error: "ProfileColor must be string!" })
        .optional(),
})
    .refine((data) => {
    return (data.fullName !== undefined ||
        data.username !== undefined ||
        data.profileColor !== undefined);
}, {
    message: "Details required for profile setup!",
    path: ["fullName", "username", "imageUrl", "profileColor"],
});
