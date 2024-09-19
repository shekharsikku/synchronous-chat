"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageRouter = exports.ContactRouter = exports.UserRouter = exports.AuthRouter = void 0;
const auth_1 = __importDefault(require("./auth"));
exports.AuthRouter = auth_1.default;
const user_1 = __importDefault(require("./user"));
exports.UserRouter = user_1.default;
const contact_1 = __importDefault(require("./contact"));
exports.ContactRouter = contact_1.default;
const message_1 = __importDefault(require("./message"));
exports.MessageRouter = message_1.default;
