"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptToken = exports.encryptToken = void 0;
const crypto_1 = require("crypto");
const generateKeyIv = (secret) => {
    const key = (0, crypto_1.createHash)("sha256")
        .update(secret)
        .digest("base64")
        .substring(0, 32);
    const iv = (0, crypto_1.createHash)("md5").update(secret).digest();
    return { key, iv };
};
const encryptToken = (plain, secret) => {
    const { key, iv } = generateKeyIv(secret);
    const cipher = (0, crypto_1.createCipheriv)("aes-256-cbc", Buffer.from(key), iv);
    let encrypted = cipher.update(plain, "utf8", "base64");
    encrypted += cipher.final("base64");
    return { encrypted, iv: iv.toString("base64") };
};
exports.encryptToken = encryptToken;
const decryptToken = (hashed, secret) => {
    const { key, iv } = generateKeyIv(secret);
    const decipher = (0, crypto_1.createDecipheriv)("aes-256-cbc", Buffer.from(key), iv);
    let decrypted = decipher.update(hashed, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return { decrypted, iv: iv.toString("base64") };
};
exports.decryptToken = decryptToken;
