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
        sparse: true,
        default: null,
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    gender: {
        type: String,
        enum: ["Male", "Female", "Other"],
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
            },
        ],
        select: false,
    },
}, {
    timestamps: true,
});
UserSchema.pre("save", function (next) {
    if (!this.username || this.username.trim() === "") {
        this.username = new mongoose_1.Types.ObjectId().toString();
    }
    next();
});
const User = (0, mongoose_1.model)("User", UserSchema);
exports.default = User;
