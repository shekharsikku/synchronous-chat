import { genSalt, hash, compare } from "bcryptjs";
import { Types } from "mongoose";
import { revokeToken } from "../middlewares/index.js";
import { User } from "../models/index.js";
import env from "../utils/env.js";
import { generateAccess, generateRefresh, createUserInfo, generateHash } from "../utils/helpers.js";
import { HttpError, ErrorResponse, SuccessResponse } from "../utils/response.js";
const signUpUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const existsEmail = await User.exists({ email });
        if (existsEmail) {
            throw new HttpError(409, "Email already exists!");
        }
        const hashSalt = await genSalt(12);
        const hashedPassword = await hash(password, hashSalt);
        await User.create({ email, password: hashedPassword });
        return SuccessResponse(res, 201, "Signed up successfully!");
    }
    catch (error) {
        return ErrorResponse(res, error.code || 500, error.message || "Error while user signup!");
    }
};
const signInUser = async (req, res) => {
    try {
        const deviceId = req.headers["x-device-id"];
        const { email, password, username } = req.body;
        const conditions = [];
        if (email) {
            conditions.push({ email });
        }
        else if (username) {
            conditions.push({ username });
        }
        else {
            throw new HttpError(400, "Email or Username required!");
        }
        const existsUser = await User.findOne({
            $or: conditions,
        }).select("+password +authentication");
        if (!existsUser) {
            throw new HttpError(404, "User not exists!");
        }
        const isCorrect = await compare(password, existsUser.password);
        if (!isCorrect) {
            throw new HttpError(403, "Incorrect password!");
        }
        const userInfo = createUserInfo(existsUser);
        await generateAccess(res, userInfo);
        if (!userInfo.setup) {
            return SuccessResponse(res, 200, "Please, complete your profile!", userInfo);
        }
        const authorizeId = new Types.ObjectId();
        const refreshToken = await generateRefresh(res, userInfo._id, authorizeId, deviceId);
        const hashedRefresh = await generateHash(refreshToken);
        const refreshExpiry = new Date(Date.now() + env.REFRESH_EXPIRY * 1000);
        existsUser.authentication?.push({
            _id: authorizeId,
            token: hashedRefresh,
            expiry: refreshExpiry,
        });
        await existsUser.save();
        return SuccessResponse(res, 200, "Signed in successfully!", userInfo);
    }
    catch (error) {
        return ErrorResponse(res, error.code || 500, error.message || "Error while user signin!");
    }
};
const signOutUser = async (req, res) => {
    const currentAuthKey = req.cookies.current;
    if (currentAuthKey) {
        await revokeToken(res, currentAuthKey);
    }
    res.clearCookie("access");
    res.clearCookie("refresh");
    res.clearCookie("current");
    return SuccessResponse(res, 200, "Signed out successfully!");
};
export { signUpUser, signInUser, signOutUser };
