"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptMessage = exports.encryptMessage = void 0;
const crypto_1 = require("crypto");
const generateIv = (recipientId) => {
    return (0, crypto_1.createHash)("md5").update(recipientId).digest();
};
const encryptMessage = (plainText, userId) => {
    const key = (0, crypto_1.createHash)("sha256")
        .update(userId)
        .digest("base64")
        .substring(0, 32);
    const iv = generateIv(userId);
    const cipher = (0, crypto_1.createCipheriv)("aes-256-cbc", Buffer.from(key), iv);
    let encrypted = cipher.update(plainText, "utf8", "base64");
    encrypted += cipher.final("base64");
    return { encrypted, iv: iv.toString("base64") };
};
exports.encryptMessage = encryptMessage;
const decryptMessage = (encryptText, userId) => {
    const key = (0, crypto_1.createHash)("sha256")
        .update(userId)
        .digest("base64")
        .substring(0, 32);
    const iv = generateIv(userId);
    const decipher = (0, crypto_1.createDecipheriv)("aes-256-cbc", Buffer.from(key), iv);
    let decrypted = decipher.update(encryptText, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return { decrypted, iv: iv.toString("base64") };
};
exports.decryptMessage = decryptMessage;
