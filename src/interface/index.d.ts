import { Types, Document } from "mongoose";

interface UserInterface extends Document {
  _id?: Types.ObjectId;
  name?: string;
  email: string;
  username?: string;
  password?: string;
  gender?: "Male" | "Female";
  image?: string;
  bio?: string;
  setup?: boolean;
  authentication?: {
    _id?: Types.ObjectId;
    token: string;
    expiry: Date;
    device?: string;
  }[];
}

interface TokenInterface {
  access?: string;
  refresh?: string;
}

interface DetailInterface {
  name?: string;
  username?: string;
  gender?: "Male" | "Female";
  bio?: string;
  setup?: boolean;
}

interface ConversationInterface extends Document {
  _id?: Types.ObjectId;
  participants: Types.ObjectId[];
  messages: Types.ObjectId[];
}

interface MessageInterface extends Document {
  _id?: Types.ObjectId;
  sender?: Types.ObjectId;
  recipient?: Types.ObjectId;
  type?: string;
  text?: string;
  file?: string;
}
