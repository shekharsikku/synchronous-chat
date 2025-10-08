import type { ConversationInterface } from "../interface/index.js";
import { Schema, model } from "mongoose";

const ConversationSchema = new Schema<ConversationInterface>({
  participants: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  interaction: {
    type: Date,
    default: Date.now,
  },
});

const Conversation = model<ConversationInterface>("Conversation", ConversationSchema);

export default Conversation;
