import { cleanEnv, str, url, port } from "envalid";
import "dotenv/config";

const env = cleanEnv(process.env, {
  MONGODB_URL: url(),
  BUCKET_NAME: str(),

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
