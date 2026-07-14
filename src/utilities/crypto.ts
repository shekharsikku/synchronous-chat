import { createSecretKey, createHash, scryptSync, randomBytes, createCipheriv, createDecipheriv } from "node:crypto";
import env from "./env.js";

export const accessSecret = createSecretKey(createHash("sha256").update(env.ACCESS_SECRET).digest());
export const refreshSecret = createSecretKey(createHash("sha256").update(env.REFRESH_SECRET).digest());

const currentSecret = scryptSync(env.COOKIES_SECRET, "current-auth-secret", 32);

export const encryptAuth = (uid: string, aid: string) => {
  const iv = randomBytes(12);

  const cipher = createCipheriv("aes-256-gcm", currentSecret, iv);

  const plaintext = JSON.stringify({ uid, aid });

  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);

  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
};

export const decryptAuth = (token: string) => {
  const data = Buffer.from(token, "base64url");

  const iv = data.subarray(0, 12);
  const tag = data.subarray(12, 28);
  const encrypted = data.subarray(28);

  const decipher = createDecipheriv("aes-256-gcm", currentSecret, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");

  return JSON.parse(decrypted) as { uid: string; aid: string };
};

export const generateHash = (token: string) => createHash("sha256").update(token).digest("hex");
