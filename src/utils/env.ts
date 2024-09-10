import dotenv from "dotenv";
import { cleanEnv, str, port } from "envalid";

dotenv.config();

const env = cleanEnv(process.env, {
  CLOUDINARY_CLOUD_NAME: str(),
  CLOUDINARY_API_KEY: str(),
  CLOUDINARY_API_SECRET: str(),

  ACCESS_TOKEN_SECRET: str(),
  ACCESS_TOKEN_EXPIRY: str(),
  ACCESS_COOKIE_EXPIRY: str(),

  REFRESH_TOKEN_SECRET: str(),
  REFRESH_TOKEN_EXPIRY: str(),
  REFRESH_COOKIE_EXPIRY: str(),

  COOKIES_SECRET: str(),
  PAYLOAD_LIMIT_ALLOWED: str(),
  PORT: port(),

  MONGODB_URI: str(),
  CORS_ORIGIN: str(),
  NODE_ENV: str(),
});

export default env;
