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
    ACCESS_SECRET: (0, envalid_1.str)(),
    ACCESS_EXPIRY: (0, envalid_1.num)(),
    REFRESH_SECRET: (0, envalid_1.str)(),
    REFRESH_EXPIRY: (0, envalid_1.num)(),
    COOKIES_SECRET: (0, envalid_1.str)(),
    PAYLOAD_LIMIT: (0, envalid_1.str)(),
    PORT: (0, envalid_1.port)(),
    MONGODB_URI: (0, envalid_1.url)(),
    CORS_ORIGIN: (0, envalid_1.str)(),
    NODE_ENV: (0, envalid_1.str)({ choices: ["development", "production"] }),
});
exports.default = env;
