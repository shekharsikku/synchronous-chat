"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const MessageSchema = new mongoose_1.Schema({
    sender: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    recipient: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    type: {
        type: String,
        enum: ["default", "edited", "deleted"],
        required: true,
        index: true,
        default: "default",
    },
    content: {
        _id: false,
        type: {
            type: String,
            enum: ["text", "file"],
            required: true,
        },
        text: {
            type: String,
            required: function () {
                return this.content.type === "text";
            },
        },
        file: {
            type: String,
            required: function () {
                return this.content.type === "file";
            },
        },
    },
    deletedAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});
const Message = (0, mongoose_1.model)("Message", MessageSchema);
exports.default = Message;
