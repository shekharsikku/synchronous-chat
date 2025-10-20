import { Schema, model } from "mongoose";
const MessageSchema = new Schema({
    sender: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    recipient: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: function () {
            return this.group && undefined;
        },
    },
    group: {
        type: Schema.Types.ObjectId,
        ref: "Group",
        default: function () {
            return this.recipient && undefined;
        },
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
        reactions: {
            type: [
                {
                    _id: false,
                    by: String,
                    emoji: String,
                },
            ],
            default: null,
        },
    },
    reply: {
        type: Schema.Types.ObjectId,
        ref: "Message",
        default: null,
    },
    deletedAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});
MessageSchema.pre("validate", function (next) {
    if (!this.recipient && !this.group) {
        return next(new Error("Either recipient or group must be provided!"));
    }
    next();
});
MessageSchema.index({ group: 1, createdAt: -1 });
MessageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
const Message = model("Message", MessageSchema);
export default Message;
