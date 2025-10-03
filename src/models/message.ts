import type { MessageInterface } from "../interface/index.js";
import { Schema, model } from "mongoose";

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

const Message = model<MessageInterface>("Message", MessageSchema);

export default Message;
