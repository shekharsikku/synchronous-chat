"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRefresh = exports.signOutUser = exports.signInUser = exports.signUpUser = void 0;
const utils_1 = require("../utils");
const helpers_1 = require("../helpers");
const user_1 = __importDefault(require("../models/user"));
const signUpUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, username } = yield req.body;
        const existedUser = yield user_1.default.findOne({
            $or: [{ email }, { username }],
        });
        if (existedUser) {
            let field;
            if (existedUser.email == email) {
                field = "Email";
            }
            else {
                field = "Username";
            }
            throw new utils_1.ApiError(409, `${field} already exists!`);
        }
        const hashed = yield (0, helpers_1.generateHash)(password);
        const userData = {
            email,
            password: hashed,
        };
        if (username) {
            userData.username = (0, helpers_1.removeSpaces)(username);
        }
        const newUser = new user_1.default(userData);
        const savedUser = yield newUser.save();
        if (savedUser) {
            return (0, utils_1.ApiResponse)(req, res, 201, "Signed up successfully!", savedUser._id);
        }
        throw new utils_1.ApiError(500, "Error while signup!");
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(req, res, error.code, error.message);
    }
});
exports.signUpUser = signUpUser;
const signInUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, username } = yield req.body;
        const user = yield user_1.default.findOne({
            $or: [{ email }, { username }],
        }).select("+password");
        if (!user) {
            throw new utils_1.ApiError(404, "User not exists!");
        }
        const checked = yield (0, helpers_1.compareHash)(password, user.password);
        if (!checked) {
            throw new utils_1.ApiError(403, "Incorrect password!");
        }
        const data = {
            _id: user._id,
            profileSetup: user.profileSetup,
        };
        if (user.profileSetup) {
            const { access } = (0, helpers_1.generateToken)(req, res, user._id, user.profileSetup);
            data.authToken = { access };
            return (0, utils_1.ApiResponse)(req, res, 202, "Please, setup your profile!", data);
        }
        const { access, refresh } = (0, helpers_1.generateToken)(req, res, user._id, user.profileSetup);
        user.refreshToken = refresh;
        yield user.save({ validateBeforeSave: false });
        data.authToken = { access, refresh };
        return (0, utils_1.ApiResponse)(req, res, 200, "Signed in successfully!", data);
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(req, res, error.code, error.message);
    }
});
exports.signInUser = signInUser;
const signOutUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    yield user_1.default.findByIdAndUpdate((_a = req.user) === null || _a === void 0 ? void 0 : _a._id, {
        $unset: {
            refreshToken: 1,
        },
    }, {
        new: true,
    });
    res.clearCookie("access");
    res.clearCookie("refresh");
    return (0, utils_1.ApiResponse)(req, res, 200, "Signed out successfully!");
});
exports.signOutUser = signOutUser;
const authRefresh = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const tokens = req.token;
    return (0, utils_1.ApiResponse)(req, res, 200, "Auth tokens refresh successfully!", tokens);
});
exports.authRefresh = authRefresh;
