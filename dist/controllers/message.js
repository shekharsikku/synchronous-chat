"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMessages = exports.deleteMessage = exports.editMessage = exports.getMessages = exports.sendMessage = void 0;
const utils_1 = require("../utils");
const socket_1 = require("../socket");
const conversation_1 = __importDefault(require("../models/conversation"));
const message_1 = __importDefault(require("../models/message"));
const sendMessage = async (req, res) => {
    try {
        const sender = req.user?._id;
        const receiver = req.params.id;
        const { type, text, file } = await req.body;
        let conversation = await conversation_1.default.findOne({
            participants: { $all: [sender, receiver] },
        });
        if (!conversation) {
            conversation = await conversation_1.default.create({
                participants: [sender, receiver],
            });
        }
        const message = new message_1.default({
            sender: sender,
            recipient: receiver,
            content: {
                type: type,
                text: text,
                file: file,
            },
        });
        if (message) {
            conversation.messages.push(message._id);
            conversation.interaction = new Date(Date.now());
        }
        await Promise.all([conversation.save(), message.save()]);
        const senderSocketId = (0, socket_1.getSocketId)(sender.toString());
        const receiverSocketId = (0, socket_1.getSocketId)(receiver);
        if (receiverSocketId.length > 0) {
            socket_1.io.to(receiverSocketId).emit("message:receive", message);
            socket_1.io.to(receiverSocketId).emit("conversation:updated", {
                _id: sender,
                interaction: conversation.interaction,
            });
        }
        socket_1.io.to(senderSocketId).emit("message:receive", message);
        socket_1.io.to(senderSocketId).emit("conversation:updated", {
            _id: receiver,
            interaction: conversation.interaction,
        });
        return (0, utils_1.ApiResponse)(res, 201, "Message sent successfully!", message);
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, 500, "Error while sending message!");
    }
};
exports.sendMessage = sendMessage;
const getMessages = async (req, res) => {
    try {
        const sender = req.user?._id;
        const receiver = req.params.id;
        const messages = await message_1.default.find({
            $or: [
                { sender: sender, recipient: receiver },
                { sender: receiver, recipient: sender },
            ],
        }).distinct("_id");
        const conversation = await conversation_1.default.findOneAndUpdate({
            participants: { $all: [sender, receiver] },
        }, [
            {
                $set: {
                    messages: {
                        $filter: {
                            input: "$messages",
                            as: "message",
                            cond: { $in: ["$$message", messages] },
                        },
                    },
                },
            },
        ], { new: true })
            .populate("messages")
            .lean();
        if (!conversation) {
            return (0, utils_1.ApiResponse)(res, 200, "No any message available!", []);
        }
        return (0, utils_1.ApiResponse)(res, 200, "Messages fetched successfully!", conversation?.messages);
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, 500, "Error while fetching messages!");
    }
};
exports.getMessages = getMessages;
const deleteMessage = async (req, res) => {
    try {
        const uid = req.user?._id;
        const mid = req.params.id;
        const message = await message_1.default.findOneAndUpdate({ _id: mid, sender: uid }, {
            type: "deleted",
            deletedAt: new Date(),
            $unset: { content: 1 },
        }, { new: true });
        if (!message) {
            throw new utils_1.ApiError(403, "You can't delete this message or message not found!");
        }
        const senderSocketId = (0, socket_1.getSocketId)(message?.sender.toString());
        const receiverSocketId = (0, socket_1.getSocketId)(message?.recipient.toString());
        if (receiverSocketId.length > 0) {
            socket_1.io.to(receiverSocketId).emit("message:remove", message);
        }
        socket_1.io.to(senderSocketId).emit("message:remove", message);
        return (0, utils_1.ApiResponse)(res, 200, "Message deleted successfully!", message);
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, error.code || 500, error.message || "Error while deleting message!");
    }
};
exports.deleteMessage = deleteMessage;
const editMessage = async (req, res) => {
    try {
        const uid = req.user?._id;
        const mid = req.params.id;
        const { text } = await req.body;
        if (!text) {
            throw new utils_1.ApiError(400, "Text content is required for editing!");
        }
        const message = await message_1.default.findOneAndUpdate({ _id: mid, sender: uid, "content.type": "text" }, {
            type: "edited",
            "content.text": text,
        }, { new: true });
        if (!message) {
            throw new utils_1.ApiError(403, "You can't edit this message or message not found!");
        }
        const senderSocketId = (0, socket_1.getSocketId)(message?.sender.toString());
        const receiverSocketId = (0, socket_1.getSocketId)(message?.recipient.toString());
        if (receiverSocketId.length > 0) {
            socket_1.io.to(receiverSocketId).emit("message:edited", message);
        }
        socket_1.io.to(senderSocketId).emit("message:edited", message);
        return (0, utils_1.ApiResponse)(res, 200, "Message edited successfully!", message);
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, error.code || 500, error.message || "Error while editing message!");
    }
};
exports.editMessage = editMessage;
const deleteMessages = async (req, res) => {
    try {
        const uid = req.user?._id;
        const hoursAgo = new Date();
        hoursAgo.setHours(hoursAgo.getHours() - 24);
        const result = await message_1.default.deleteMany({
            $or: [{ sender: uid }, { recipient: uid }],
            createdAt: { $lt: hoursAgo },
        });
        return (0, utils_1.ApiResponse)(res, 200, "Older messages deleted!", result);
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, 500, "Error while deleting messages!");
    }
};
exports.deleteMessages = deleteMessages;
