import { Schema, model } from "mongoose";

import type { MessageInterface } from "#/interface/index.js";

const MessageSchema = new Schema<MessageInterface>(
  {
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
  },
  {
    timestamps: true,
  }
);

/** Custom validation — must have either recipient or group */
MessageSchema.pre("validate", async function () {
  if (!this.recipient && !this.group) {
    throw new Error("Either recipient or group must be provided!");
  }
});

/** Index for group messages */
MessageSchema.index({ group: 1, createdAt: -1 });

/** Index for 1:1 messages */
MessageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });

const Message = model<MessageInterface>("Message", MessageSchema);

export default Message;
