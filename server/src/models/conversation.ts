import { Schema, model } from "mongoose";
import { ConversationInterface } from "../interface";

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
  },
  { timestamps: true }
);

const Conversation = model<ConversationInterface>(
  "Conversation",
  ConversationSchema
);

export default Conversation;
