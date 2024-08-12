import { Schema, model } from "mongoose";
import { UserInterface } from "../interface";

const UserSchema = new Schema<UserInterface>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    fullName: {
      type: String,
      required: false,
      default: "",
    },
    username: {
      type: String,
      lowercase: true,
      required: false,
      default: "",
    },
    imageUrl: {
      type: String,
      required: false,
      default: "",
    },
    profileColor: {
      type: String,
      required: false,
      default: "0",
    },
    profileSetup: {
      type: Boolean,
      default: true,
    },
    refreshToken: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

const User = model<UserInterface>("User", UserSchema);

export default User;
