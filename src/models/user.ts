import type { UserInterface } from "@interface/index.js";
import { Schema, model } from "mongoose";

const UserSchema = new Schema<UserInterface>(
  {
    name: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      unique: true,
      lowercase: true,
      sparse: true,
      default: null,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      default: null,
    },
    image: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      default: null,
    },
    setup: {
      type: Boolean,
      default: false,
    },
    authentication: {
      type: [
        {
          token: String,
          expiry: Date,
        },
      ],
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.pre("save", async function () {
  if (!this.username || this.username.trim() === "") {
    /** Generate a temporary username by splitting email  */
    const localPart = this.email.split("@")[0].split(".")[0];

    /** Unique suffix according to current timestamp  */
    const uniqueSuffix = Date.now().toString(36);

    /** Use combination of temporary username and unique suffix */
    this.username = `${localPart}_${uniqueSuffix}`;
  }
});

const User = model<UserInterface>("User", UserSchema);

export default User;
