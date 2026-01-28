import { Types, Document } from "mongoose";

interface UserInterface extends Document {
  name?: string;
  email: string;
  username?: string;
  password?: string;
  gender?: "Male" | "Female" | "Other";
  image?: string;
  bio?: string;
  setup?: boolean;
  authentication?: {
    _id?: Types.ObjectId;
    token: string;
    expiry: Date;
  }[];
}

interface ConversationInterface extends Document {
  participants: Types.ObjectId[];
  models: "User" | "Group";
  interaction: Date;
}

interface MessageInterface extends Document {
  sender: Types.ObjectId;
  recipient?: Types.ObjectId;
  group?: Types.ObjectId;
  type: "default" | "edited" | "deleted";
  content: {
    type: "text" | "file";
    text?: string;
    file?: string;
    reactions?: {
      by: string;
      emoji: string;
    }[];
  };
  reply?: Types.ObjectId;
  deletedAt?: Date;
}

interface GroupInterface extends Document {
  name: string;
  description: string;
  avatar?: string;
  admin: Types.ObjectId;
  members: Types.ObjectId[];
}

declare module "express" {
  interface Request {
    user?: UserInterface;
  }
}

declare module "jose" {
  interface JWTPayload {
    uid?: string;
  }
}
