"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const UserSchema = new mongoose_1.Schema({
    name: {
        type: String,
        default: null,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    username: {
        type: String,
        unique: true,
        lowercase: true,
        default: null,
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    gender: {
        type: String,
        enum: ["Male", "Female"],
        default: null,
    },
    image: {
        type: String,
        default: null,
    },
    bio: {
        type: String,
        default: null,
    },
    setup: {
        type: Boolean,
        default: false,
    },
    authentication: {
        type: [
            {
                token: String,
                expiry: Date,
                device: {
                    type: String,
                    default: null,
                },
            },
        ],
        select: false,
    },
}, {
    timestamps: true,
});
const User = (0, mongoose_1.model)("User", UserSchema);
exports.default = User;
