import { type InferSchemaType, type HydratedDocument, Schema, model } from "mongoose";

const ContentSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["text", "file"],
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
    reactions: {
      type: [
        {
          _id: false,
          by: String,
          emoji: String,
        },
      ],
      default: [],
    },
  },
  {
    _id: false,
  }
);

const MessageSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: undefined,
    },
    group: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      default: undefined,
    },
    type: {
      type: String,
      enum: ["default", "edited", "deleted"],
      required: true,
      index: true,
      default: "default",
    },
    content: {
      type: ContentSchema,
      required: true,
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

/** Custom validation — must have either recipient or group */
MessageSchema.pre("validate", function () {
  if (!this.recipient && !this.group) {
    this.invalidate("recipient", "Either recipient or group must be provided!");
  }

  if (this.recipient && this.group) {
    this.invalidate("recipient", "Message cannot have both recipient and group!");
  }
});

/** Indexing for messages */
MessageSchema.index({ group: 1, createdAt: -1 });
MessageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
MessageSchema.index({ recipient: 1, sender: 1, createdAt: -1 });

export type MessageType = InferSchemaType<typeof MessageSchema>;
export type MessageDocument = HydratedDocument<MessageType>;

const MessageModel = model<MessageType>("Message", MessageSchema);
export default MessageModel;
