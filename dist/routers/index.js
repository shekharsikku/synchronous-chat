"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_js_1 = require("../utils/index.js");
const auth_js_1 = __importDefault(require("./auth.js"));
const user_js_1 = __importDefault(require("./user.js"));
const contact_js_1 = __importDefault(require("./contact.js"));
const message_js_1 = __importDefault(require("./message.js"));
const router = (0, express_1.Router)();
router.use("/auth", auth_js_1.default);
router.use("/user", user_js_1.default);
router.use("/contact", contact_js_1.default);
router.use("/message", message_js_1.default);
router.get("/wakeup", (req, res) => {
    const from = req.query.from || "Unknown";
    return (0, index_js_1.SuccessResponse)(res, 200, `Wake up server by ${from}!`);
});
exports.default = router;
