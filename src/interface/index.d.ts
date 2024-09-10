import { Types, Document } from "mongoose";

interface UserInterface extends Document {
  _id?: Types.ObjectId;
  email: string;
  password: string;
  fullName?: string;
  username?: string;
  imageUrl?: string;
  profileColor?: string;
  profileSetup?: boolean;
  refreshToken?: string;
}

interface UserSignUpInterface {
  email: string;
  password: string;
  username?: string;
}

interface UserTokenInterface {
  access?: string;
  refresh?: string;
}

interface UserSignInInterface {
  _id?: Types.ObjectId;
  email?: string;
  profileSetup?: boolean;
  authToken?: UserTokenInterface;
}

interface UserProfileInterface {
  _id?: Types.ObjectId;
  email?: string;
  fullName?: string;
  username?: string;
  imageUrl?: string;
  profileColor?: string;
  profileSetup?: boolean;
  authToken?: UserTokenInterface;
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
  messageType?: string;
  textMessage?: string;
  fileUrl?: string;
}
