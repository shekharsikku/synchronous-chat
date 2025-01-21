import { createHash, createCipheriv, createDecipheriv } from "crypto";

const generateIv = (recipientId: string) => {
  return createHash("md5").update(recipientId).digest();
};

export const encryptMessage = (plainText: string, userId: string) => {
  const key = createHash("sha256")
    .update(userId)
    .digest("base64")
    .substring(0, 32);

  const iv = generateIv(userId);

  const cipher = createCipheriv("aes-256-cbc", Buffer.from(key), iv);

  let encrypted = cipher.update(plainText, "utf8", "base64");
  encrypted += cipher.final("base64");

  return { encrypted, iv: iv.toString("base64") };
};

export const decryptMessage = (encryptText: string, userId: string) => {
  const key = createHash("sha256")
    .update(userId)
    .digest("base64")
    .substring(0, 32);

  const iv = generateIv(userId);

  const decipher = createDecipheriv("aes-256-cbc", Buffer.from(key), iv);

  let decrypted = decipher.update(encryptText, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return { decrypted, iv: iv.toString("base64") };
};
