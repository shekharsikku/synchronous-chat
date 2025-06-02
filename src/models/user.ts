import type { UserInterface } from "../interface/index.js";
import { Types, Schema, model } from "mongoose";

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

UserSchema.pre("save", function (next) {
  if (!this.username || this.username.trim() === "") {
    this.username = new Types.ObjectId().toString();
  }
  next();
});

const User = model<UserInterface>("User", UserSchema);

export default User;
