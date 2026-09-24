import { randomBytes } from "node:crypto";
import { type InferSchemaType, type HydratedDocument, Schema, model } from "mongoose";

const AuthSchema = new Schema(
  {
    token: {
      type: String,
      required: true,
    },
    expiry: {
      type: Date,
      required: true,
    },
  },
  {
    _id: false,
  }
);

const UserSchema = new Schema(
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
      type: [AuthSchema],
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.pre("save", function () {
  if (!this.username || this.username.trim() === "") {
    /** Generate a temporary username by splitting email  */
    const localPart = this.email.split("@")[0]?.split(".")[0];

    /** Unique suffix using random hex string */
    const uniqueSuffix = randomBytes(4).toString("hex");

    /** Use combination of temporary username and unique suffix */
    this.username = `${localPart}_${uniqueSuffix}`;
  }
});

UserSchema.index({ "authentication.token": 1 });

export type UserType = InferSchemaType<typeof UserSchema>;
export type UserDocument = HydratedDocument<UserType>;

const UserModel = model<UserType>("User", UserSchema);
export default UserModel;
