import { Schema, model } from "mongoose";
const UserSchema = new Schema({
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
}, {
    timestamps: true,
});
UserSchema.pre("save", function (next) {
    if (!this.username || this.username.trim() === "") {
        const localPart = this.email.split("@")[0].split(".")[0];
        const uniqueSuffix = Date.now().toString(36);
        this.username = `${localPart}_${uniqueSuffix}`;
    }
    next();
});
const User = model("User", UserSchema);
export default User;
