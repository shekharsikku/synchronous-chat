import type { GroupInterface } from "../interface/index.js";
import { Schema, model } from "mongoose";

const GroupSchema = new Schema<GroupInterface>(
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

const Group = model<GroupInterface>("Group", GroupSchema);

export default Group;
