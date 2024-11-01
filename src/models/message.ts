import { Schema, model } from "mongoose";
import { MessageInterface } from "../interface";

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
      enum: ["text", "file", "deleted"],
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
  },
  {
    timestamps: true,
  }
);

const Message = model<MessageInterface>("Message", MessageSchema);

export default Message;
