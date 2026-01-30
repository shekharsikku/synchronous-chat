import { Schema, model } from "mongoose";

import type { ConversationInterface } from "#/interfaces/index.js";

const ConversationSchema = new Schema<ConversationInterface>({
  participants: [
    {
      type: Schema.Types.ObjectId,
      refPath: "models",
    },
  ],
  models: {
    type: String,
    enum: ["User", "Group"],
    required: true,
  },
  interaction: {
    type: Date,
    default: Date.now,
  },
});

const Conversation = model<ConversationInterface>("Conversation", ConversationSchema);

export default Conversation;
