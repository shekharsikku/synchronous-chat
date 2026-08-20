import { cleanEnv, str, url, num, port } from "envalid";
import "dotenv/config";

const env = cleanEnv(process.env, {
  CLOUDINARY_CLOUD_NAME: str(),
  CLOUDINARY_API_KEY: str(),
  CLOUDINARY_API_SECRET: str(),

  VAPID_MAILTO: str(),
  VAPID_PUBLIC_KEY: str(),
  VAPID_PRIVATE_KEY: str(),

  ACCESS_SECRET: str(),
  ACCESS_EXPIRY: num(),
  REFRESH_SECRET: str(),
  REFRESH_EXPIRY: num(),

  COOKIES_SECRET: str(),
  COOKIES_SALT: str(),
  MONGODB_URI: url(),
  CORS_ORIGIN: str(),
  BODY_LIMIT: str(),
  PORT: port(),

  NODE_ENV: str({
    choices: ["development", "production"],
    default: "development",
  }),
  LOG_LEVEL: str({
    choices: ["fatal", "error", "warn", "info", "debug", "trace", "silent"],
    default: "trace",
  }),
});

export default env;
