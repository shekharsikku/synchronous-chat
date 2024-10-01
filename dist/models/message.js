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
        enum: ["text", "file"],
        required: true,
    },
    text: {
        type: String,
        required: function () {
            return this.type === "text";
        },
    },
    file: {
        type: String,
        required: function () {
            return this.type === "file";
        },
    },
}, {
    timestamps: true,
});
const Message = (0, mongoose_1.model)("Message", MessageSchema);
exports.default = Message;
