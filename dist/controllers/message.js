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
exports.translateMessage = exports.deleteMessages = exports.deleteMessage = exports.getMessages = exports.sendMessage = void 0;
const utils_1 = require("../utils");
const socket_1 = require("../socket");
const conversation_1 = __importDefault(require("../models/conversation"));
const message_1 = __importDefault(require("../models/message"));
const bing_translate_api_1 = require("bing-translate-api");
const sendMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const sender = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const receiver = req.params.id;
        const { type, text, file } = yield req.body;
        let conversation = yield conversation_1.default.findOne({
            participants: { $all: [sender, receiver] },
        });
        if (!conversation) {
            conversation = yield conversation_1.default.create({
                participants: [sender, receiver],
            });
        }
        const message = new message_1.default({
            sender: sender,
            recipient: receiver,
            type: type,
            text: text,
            file: file,
        });
        if (message) {
            conversation.messages.push(message._id);
            conversation.interaction = new Date(Date.now());
        }
        yield Promise.all([conversation.save(), message.save()]);
        const senderSocketId = (0, socket_1.getSocketId)(String(sender));
        const receiverSocketId = (0, socket_1.getSocketId)(receiver);
        if (receiverSocketId.size > 0) {
            const receiverSockets = Array.from(receiverSocketId);
            socket_1.io.to(receiverSockets).emit("message:receive", message);
            socket_1.io.to(receiverSockets).emit("conversation:updated", {
                _id: sender,
                interaction: conversation.interaction,
            });
        }
        const senderSockets = Array.from(senderSocketId);
        socket_1.io.to(senderSockets).emit("message:receive", message);
        socket_1.io.to(senderSockets).emit("conversation:updated", {
            _id: receiver,
            interaction: conversation.interaction,
        });
        return (0, utils_1.ApiResponse)(res, 201, "Message sent successfully!", message);
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, 500, "Something Went Wrong!");
    }
});
exports.sendMessage = sendMessage;
const cleanupConversation = (conversationId) => __awaiter(void 0, void 0, void 0, function* () {
    const conversations = yield conversation_1.default.findById(conversationId).lean();
    if (conversations && conversations.messages.length > 0) {
        const validMessages = yield message_1.default.find({
            _id: { $in: conversations.messages },
        }).distinct("_id");
        if (validMessages.length !== conversations.messages.length) {
            yield conversation_1.default.updateOne({ _id: conversationId }, { $set: { messages: validMessages } });
        }
    }
});
const getMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const sender = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const receiver = req.params.id;
        const conversation = yield conversation_1.default.findOne({
            participants: { $all: [sender, receiver] },
        })
            .populate("messages")
            .lean();
        if (!conversation) {
            return (0, utils_1.ApiResponse)(res, 200, "No any message available!", []);
        }
        yield cleanupConversation(conversation._id);
        const messages = conversation.messages;
        return (0, utils_1.ApiResponse)(res, 200, "Messages fetched successfully!", messages);
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, 500, "Something Went Wrong!");
    }
});
exports.getMessages = getMessages;
const deleteMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const uid = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const mid = req.params.id;
        const message = yield message_1.default.findById(mid);
        if (!message) {
            throw new utils_1.ApiError(404, "Message not found");
        }
        const senderSocketId = (0, socket_1.getSocketId)(String(message === null || message === void 0 ? void 0 : message.sender));
        const receiverSocketId = (0, socket_1.getSocketId)(String(message === null || message === void 0 ? void 0 : message.recipient));
        if (message && ((_b = message.sender) === null || _b === void 0 ? void 0 : _b.equals(uid))) {
            message.type === "text" ? (message.text = "") : (message.file = "");
            message.type = "deleted";
            yield message.save({ validateBeforeSave: false });
            if (receiverSocketId.size > 0) {
                socket_1.io.to(Array.from(receiverSocketId)).emit("message:remove", message);
            }
            socket_1.io.to(Array.from(senderSocketId)).emit("message:remove", message);
            return (0, utils_1.ApiResponse)(res, 200, "Message deleted successfully!", message);
        }
        else {
            throw new utils_1.ApiError(403, "You can't delete this message!");
        }
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, error.code, error.message);
    }
});
exports.deleteMessage = deleteMessage;
const deleteMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const uid = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const hoursAgo = new Date();
        hoursAgo.setHours(hoursAgo.getHours() - 24);
        const result = yield message_1.default.deleteMany({
            $or: [{ sender: uid }, { recipient: uid }],
            createdAt: { $lt: hoursAgo },
        });
        return (0, utils_1.ApiResponse)(res, 200, "Older messages deleted!", result);
    }
    catch (error) {
        console.log(`Error: ${error.message}`);
    }
});
exports.deleteMessages = deleteMessages;
const translateMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { message, language } = yield req.body;
        const result = yield (0, bing_translate_api_1.translate)(message, null, language);
        if (!result) {
            throw new utils_1.ApiError(500, "Error while translating text!");
        }
        return (0, utils_1.ApiResponse)(res, 200, "Text translated successfully!", result.translation);
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, error.code, error.message);
    }
});
exports.translateMessage = translateMessage;
