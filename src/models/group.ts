import { type InferSchemaType, type HydratedDocument, Schema, model } from "mongoose";

const GroupSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    admin: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

GroupSchema.pre("save", function () {
  if (!this.members.includes(this.admin)) {
    this.members.push(this.admin);
  }
});

export type GroupType = InferSchemaType<typeof GroupSchema>;
export type GroupDocument = HydratedDocument<GroupType>;

const GroupModel = model<GroupType>("Group", GroupSchema);
export default GroupModel;
