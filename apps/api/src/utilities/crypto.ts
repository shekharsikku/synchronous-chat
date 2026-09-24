import { createECDH, createHash, createSecretKey } from "node:crypto";
import env from "#/configs/env.js";

export const generateHash = (token: string) => {
  return createHash("sha256").update(token).digest("hex");
};

export const createSecret = (secret: string) => {
  return createSecretKey(createHash("sha256").update(secret).digest());
};

export const verifyKeyPair = (publicKey: string, privateKey = env.VAPID_PRIVATE_KEY) => {
  const ecdh = createECDH("prime256v1");

  ecdh.setPrivateKey(Buffer.from(privateKey, "base64url"));

  const derivedKey = ecdh.getPublicKey("base64url", "uncompressed");

  return derivedKey === publicKey;
};
