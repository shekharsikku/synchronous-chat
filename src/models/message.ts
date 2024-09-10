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
    messageType: {
      type: String,
      enum: ["text", "file"],
      required: true,
    },
    textMessage: {
      type: String,
      required: function () {
        return this.messageType === "text";
      },
    },
    fileUrl: {
      type: String,
      required: function () {
        return this.messageType === "file";
      },
    },
  },
  {
    timestamps: true,
  }
);

const Message = model<MessageInterface>("Message", MessageSchema);

export default Message;
