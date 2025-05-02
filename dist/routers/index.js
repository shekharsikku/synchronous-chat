"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("./auth"));
const user_1 = __importDefault(require("./user"));
const contact_1 = __importDefault(require("./contact"));
const message_1 = __importDefault(require("./message"));
const router = (0, express_1.Router)();
router.use("/auth", auth_1.default);
router.use("/user", user_1.default);
router.use("/contact", contact_1.default);
router.use("/message", message_1.default);
router.get("/wakeup", (req, res) => {
    const from = req.query.from;
    res.status(200).json({ message: `Wake up server from ${from}!` });
});
exports.default = router;
