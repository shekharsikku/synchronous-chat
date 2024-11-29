"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const ConversationSchema = new mongoose_1.Schema({
    participants: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    messages: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Message",
            default: [],
        },
    ],
    interaction: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });
const Conversation = (0, mongoose_1.model)("Conversation", ConversationSchema);
exports.default = Conversation;
