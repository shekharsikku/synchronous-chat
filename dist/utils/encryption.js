"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestEncryption = exports.decryptMessage = exports.encryptMessage = void 0;
const utils_1 = require("../utils");
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
const TestEncryption = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { text, uid } = yield req.body;
        if (!text || !uid) {
            throw new utils_1.ApiError(400, "Required text and uid!");
        }
        const { encrypted, iv: eiv } = (0, exports.encryptMessage)(text, uid);
        const { decrypted, iv: div } = (0, exports.decryptMessage)(encrypted, uid);
        if (eiv === div) {
            const data = { encrypted, decrypted };
            return (0, utils_1.ApiResponse)(res, 200, "Text encrypt decrypt success!", data);
        }
        throw new utils_1.ApiError(400, "Something went wrong!");
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, error.code, error.message);
    }
});
exports.TestEncryption = TestEncryption;
