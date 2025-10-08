import { Schema, model } from "mongoose";
const ConversationSchema = new Schema({
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
const Conversation = model("Conversation", ConversationSchema);
export default Conversation;
