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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bing_translate_api_1 = require("bing-translate-api");
const express_1 = require("express");
const utils_1 = require("../utils");
const auth_1 = __importDefault(require("./auth"));
const user_1 = __importDefault(require("./user"));
const contact_1 = __importDefault(require("./contact"));
const message_1 = __importDefault(require("./message"));
const router = (0, express_1.Router)();
router.use("/auth", auth_1.default);
router.use("/user", user_1.default);
router.use("/contact", contact_1.default);
router.use("/message", message_1.default);
const encryption_1 = require("../utils/encryption");
router.all("/encryption", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { text, uid } = yield req.body;
        if (!text || !uid) {
            throw new utils_1.ApiError(400, "Required text and uid!");
        }
        const { encrypted, iv: eiv } = (0, encryption_1.encryptMessage)(text, uid);
        const { decrypted, iv: div } = (0, encryption_1.decryptMessage)(encrypted, uid);
        if (eiv === div) {
            const data = { encrypted, decrypted };
            return (0, utils_1.ApiResponse)(res, 200, "Text encrypt decrypt success!", data);
        }
        throw new utils_1.ApiError(400, "Something went wrong!");
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, error.code, error.message);
    }
}));
router.get("/wakeup", (req, res) => {
    const from = req.query.from;
    res.status(200).json({ message: `Wake up server from ${from}!` });
});
router.post("/translate", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { message, language } = yield req.body;
        const result = yield (0, bing_translate_api_1.translate)(message, null, language);
        if (!result) {
            throw new utils_1.ApiError(500, "Error while translating message!");
        }
        return (0, utils_1.ApiResponse)(res, 200, "Text translated successfully!", result.translation);
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, error.code, error.message);
    }
}));
exports.default = router;
