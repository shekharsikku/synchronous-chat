"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const envalid_1 = require("envalid");
dotenv_1.default.config();
const env = (0, envalid_1.cleanEnv)(process.env, {
    CLOUDINARY_CLOUD_NAME: (0, envalid_1.str)(),
    CLOUDINARY_API_KEY: (0, envalid_1.str)(),
    CLOUDINARY_API_SECRET: (0, envalid_1.str)(),
    DEFAULT_USER_IMAGE_URL: (0, envalid_1.str)(),
    ACCESS_TOKEN_SECRET: (0, envalid_1.str)(),
    ACCESS_TOKEN_EXPIRY: (0, envalid_1.str)(),
    ACCESS_COOKIE_EXPIRY: (0, envalid_1.str)(),
    REFRESH_TOKEN_SECRET: (0, envalid_1.str)(),
    REFRESH_TOKEN_EXPIRY: (0, envalid_1.str)(),
    REFRESH_COOKIE_EXPIRY: (0, envalid_1.str)(),
    COOKIES_SECRET: (0, envalid_1.str)(),
    MONGODB_URI: (0, envalid_1.str)(),
    CORS_ORIGIN: (0, envalid_1.str)(),
    ALLOWED_METHODS: (0, envalid_1.str)(),
    PAYLOAD_LIMIT_ALLOWED: (0, envalid_1.str)(),
    PORT: (0, envalid_1.port)(),
    NODE_ENV: (0, envalid_1.str)(),
});
exports.default = env;
