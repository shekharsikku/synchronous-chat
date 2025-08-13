import { createHash, createCipheriv, createDecipheriv } from "crypto";

const generateKeyIv = (secret: string) => {
  const key = createHash("sha256").update(secret).digest("base64").substring(0, 32);

  const iv = createHash("md5").update(secret).digest();

  return { key, iv };
};

export const encryptToken = (plain: string, secret: string) => {
  const { key, iv } = generateKeyIv(secret);

  const cipher = createCipheriv("aes-256-cbc", Buffer.from(key), iv);

  let encrypted = cipher.update(plain, "utf8", "base64");
  encrypted += cipher.final("base64");

  return { encrypted, iv: iv.toString("base64") };
};

export const decryptToken = (hashed: string, secret: string) => {
  const { key, iv } = generateKeyIv(secret);

  const decipher = createDecipheriv("aes-256-cbc", Buffer.from(key), iv);

  let decrypted = decipher.update(hashed, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return { decrypted, iv: iv.toString("base64") };
};
