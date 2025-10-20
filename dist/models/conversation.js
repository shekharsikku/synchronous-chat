import { Schema, model } from "mongoose";
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
const Conversation = model("Conversation", ConversationSchema);
export default Conversation;
