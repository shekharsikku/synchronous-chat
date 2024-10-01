import { Schema, model } from "mongoose";
import { UserInterface } from "../interface";

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
      default: null,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    gender: {
      type: String,
      enum: ["Male", "Female"],
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
          device: {
            type: String,
            default: null,
          },
        },
      ],
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

const User = model<UserInterface>("User", UserSchema);

export default User;
