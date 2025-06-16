import { cleanEnv, str, url, num, port } from "envalid";
import { config } from "dotenv";
config();
const env = cleanEnv(process.env, {
    CLOUDINARY_CLOUD_NAME: str(),
    CLOUDINARY_API_KEY: str(),
    CLOUDINARY_API_SECRET: str(),
    ACCESS_SECRET: str(),
    ACCESS_EXPIRY: num(),
    REFRESH_SECRET: str(),
    REFRESH_EXPIRY: num(),
    COOKIES_SECRET: str(),
    SOCKET_SECRET: str(),
    PAYLOAD_LIMIT: str(),
    PORT: port(),
    MONGODB_URI: url(),
    CORS_ORIGIN: str(),
    NODE_ENV: str({ choices: ["development", "production"] }),
});
export default env;
