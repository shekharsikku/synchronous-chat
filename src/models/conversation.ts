import type { ConversationInterface } from "../interface/index.js";
import { Schema, model } from "mongoose";

const ConversationSchema = new Schema<ConversationInterface>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    messages: [
      {
        type: Schema.Types.ObjectId,
        ref: "Message",
        default: [],
      },
    ],
    interaction: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Conversation = model<ConversationInterface>("Conversation", ConversationSchema);

export default Conversation;
