"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const UserSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    fullName: {
        type: String,
        required: false,
        default: "",
    },
    username: {
        type: String,
        lowercase: true,
        required: false,
        default: "",
    },
    imageUrl: {
        type: String,
        required: false,
        default: "",
    },
    profileColor: {
        type: String,
        required: false,
        default: "0",
    },
    profileSetup: {
        type: Boolean,
        default: true,
    },
    refreshToken: {
        type: String,
        select: false,
    },
}, {
    timestamps: true,
});
const User = (0, mongoose_1.model)("User", UserSchema);
exports.default = User;
