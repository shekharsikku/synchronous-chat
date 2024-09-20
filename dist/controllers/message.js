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
exports.deleteMessages = exports.deleteMessage = exports.getMessages = exports.sendMessage = void 0;
const utils_1 = require("../utils");
const socket_1 = require("../socket");
const mongoose_1 = require("mongoose");
const conversation_1 = __importDefault(require("../models/conversation"));
const message_1 = __importDefault(require("../models/message"));
const sendMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const senderId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { id: receiverId } = req.params;
        const { type, message, file } = yield req.body;
        let conversation = yield conversation_1.default.findOne({
            participants: { $all: [senderId, receiverId] },
        });
        if (!conversation) {
            conversation = yield conversation_1.default.create({
                participants: [senderId, receiverId],
            });
        }
        const newMessage = new message_1.default({
            sender: senderId,
            recipient: receiverId,
            messageType: type,
            textMessage: message,
            fileUrl: file,
        });
        if (newMessage) {
            conversation.messages.push(newMessage._id);
        }
        yield Promise.all([conversation.save(), newMessage.save()]);
        const receiverSocketId = (0, socket_1.getSocketId)(receiverId);
        if (receiverSocketId) {
            socket_1.io.to(receiverSocketId).emit("newMessage", newMessage);
        }
        return (0, utils_1.ApiResponse)(req, res, 201, "Message sent successfully!", newMessage);
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(req, res, 500, "Something Went Wrong!");
    }
});
exports.sendMessage = sendMessage;
function cleanupConversation(documentId) {
    return __awaiter(this, void 0, void 0, function* () {
        const conversations = yield conversation_1.default.findById(documentId);
        if (conversations) {
            const validMessages = [];
            for (const messageId of conversations.messages) {
                const messageExists = yield (0, mongoose_1.model)("Message").exists({ _id: messageId });
                if (messageExists) {
                    validMessages.push(messageId);
                }
            }
            conversations.messages = validMessages;
            yield conversations.save();
        }
    });
}
const getMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const senderId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { id: userToChatId } = req.params;
        const conversation = yield conversation_1.default.findOne({
            participants: { $all: [senderId, userToChatId] },
        }).populate("messages");
        if (!conversation) {
            return (0, utils_1.ApiResponse)(req, res, 200, "No any message available!", []);
        }
        yield cleanupConversation(conversation._id);
        const messages = conversation.messages;
        return (0, utils_1.ApiResponse)(req, res, 200, "Messages fetched successfully!", messages);
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(req, res, 500, "Something Went Wrong!");
    }
});
exports.getMessages = getMessages;
const deleteMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const senderId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { id: messageId } = req.params;
        const currentMessage = yield message_1.default.findById(messageId);
        if (!currentMessage) {
            throw new utils_1.ApiError(404, "Message not found");
        }
        const senderSocketId = (0, socket_1.getSocketId)(String(currentMessage === null || currentMessage === void 0 ? void 0 : currentMessage.sender));
        const receiverSocketId = (0, socket_1.getSocketId)(String(currentMessage === null || currentMessage === void 0 ? void 0 : currentMessage.recipient));
        if (currentMessage && ((_b = currentMessage.sender) === null || _b === void 0 ? void 0 : _b.equals(senderId))) {
            currentMessage.messageType === "text"
                ? (currentMessage.textMessage = "")
                : (currentMessage.fileUrl = "");
            yield currentMessage.save({ validateBeforeSave: false });
            if (receiverSocketId) {
                socket_1.io.to(receiverSocketId).emit("messageRemove", currentMessage);
            }
            socket_1.io.to(senderSocketId).emit("messageRemove", currentMessage);
            // this will emit event to all active clients
            // io.emit("messageRemove", currentMessage);
            return (0, utils_1.ApiResponse)(req, res, 200, "Message deleted successfully!", currentMessage);
        }
        else {
            throw new utils_1.ApiError(403, "You can't delete this message!");
        }
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(req, res, error.code, error.message);
    }
});
exports.deleteMessage = deleteMessage;
const deleteMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const hoursAgo = new Date();
        hoursAgo.setHours(hoursAgo.getHours() - 24);
        const result = yield message_1.default.deleteMany({
            $or: [{ sender: userId }, { recipient: userId }],
            createdAt: { $lt: hoursAgo },
        });
        return (0, utils_1.ApiResponse)(req, res, 202, "Older messages deleted!", result);
    }
    catch (error) {
        console.log(`Error: ${error.message}`);
    }
});
exports.deleteMessages = deleteMessages;
