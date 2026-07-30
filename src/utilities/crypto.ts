import {
  createCipheriv,
  createDecipheriv,
  createECDH,
  createHash,
  createSecretKey,
  randomBytes,
  scryptSync,
} from "node:crypto";
import env from "./env.js";

const generateBuffer = (secret: string) => createHash("sha256").update(secret).digest();

export const accessSecret = createSecretKey(generateBuffer(env.ACCESS_SECRET));

export const refreshSecret = createSecretKey(generateBuffer(env.REFRESH_SECRET));

const currentSecret = scryptSync(env.COOKIES_SECRET, env.COOKIES_SALT, 32);

export const encryptAuth = (uid: string, aid: string) => {
  const iv = randomBytes(12);

  const cipher = createCipheriv("aes-256-gcm", currentSecret, iv);

  const plaintext = JSON.stringify({ uid, aid });

  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);

  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, ciphertext]).toString("base64url");
};

export const decryptAuth = (token: string): { uid: string; aid: string } => {
  const data = Buffer.from(token, "base64url");

  const iv = data.subarray(0, 12);
  const tag = data.subarray(12, 28);
  const ciphertext = data.subarray(28);

  const decipher = createDecipheriv("aes-256-gcm", currentSecret, iv);
  decipher.setAuthTag(tag);

  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");

  return JSON.parse(plaintext) as { uid: string; aid: string };
};

export const generateHash = (token: string) => createHash("sha256").update(token).digest("hex");

export const verifyKeyPair = (publicKey: string, privateKey = env.VAPID_PRIVATE_KEY) => {
  const ecdh = createECDH("prime256v1");

  ecdh.setPrivateKey(Buffer.from(privateKey, "base64url"));

  const derivedKey = ecdh.getPublicKey("base64url", "uncompressed");

  return derivedKey === publicKey;
};
