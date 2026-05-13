import { type InferSchemaType, type HydratedDocument, Schema, model } from "mongoose";

const ConversationSchema = new Schema({
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

export type ConversationType = InferSchemaType<typeof ConversationSchema>;
export type ConversationDocument = HydratedDocument<ConversationType>;

const ConversationModel = model<ConversationType>("Conversation", ConversationSchema);
export default ConversationModel;
