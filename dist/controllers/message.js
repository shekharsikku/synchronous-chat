import { HttpError, SuccessResponse, ErrorResponse } from "../utils/index.js";
import { getSocketId, io } from "../socket.js";
import { translate } from "bing-translate-api";
import { Message, Conversation } from "../models/index.js";
const sendMessage = async (req, res) => {
    try {
        const sender = req.user?._id;
        const receiver = req.params.id;
        const { type, text, file } = (await req.body);
        let conversation = await Conversation.findOne({
            participants: { $all: [sender, receiver] },
        });
        if (!conversation) {
            conversation = await Conversation.create({
                participants: [sender, receiver],
            });
        }
        const message = new Message({
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
        const senderSocketId = getSocketId(sender.toString());
        const receiverSocketId = getSocketId(receiver);
        if (receiverSocketId.length > 0) {
            io.to(receiverSocketId).emit("message:receive", message);
            io.to(receiverSocketId).emit("conversation:updated", {
                _id: sender,
                interaction: conversation.interaction,
            });
        }
        io.to(senderSocketId).emit("message:receive", message);
        io.to(senderSocketId).emit("conversation:updated", {
            _id: receiver,
            interaction: conversation.interaction,
        });
        return SuccessResponse(res, 201, "Message sent successfully!", message);
    }
    catch (error) {
        return ErrorResponse(res, error.code || 500, error.message || "Error while sending message!");
    }
};
const getMessages = async (req, res) => {
    try {
        const sender = req.user?._id;
        const receiver = req.params.id;
        const messages = await Message.find({
            $or: [
                { sender: sender, recipient: receiver },
                { sender: receiver, recipient: sender },
            ],
        }).distinct("_id");
        const conversation = await Conversation.findOneAndUpdate({
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
            return SuccessResponse(res, 200, "No any message available!", []);
        }
        return SuccessResponse(res, 200, "Messages fetched successfully!", conversation?.messages);
    }
    catch (error) {
        return ErrorResponse(res, error.code || 500, error.message || "Error while fetching messages!");
    }
};
const deleteMessage = async (req, res) => {
    try {
        const uid = req.user?._id;
        const mid = req.params.id;
        const message = await Message.findOneAndUpdate({ _id: mid, sender: uid }, {
            type: "deleted",
            deletedAt: new Date(),
            $unset: { content: 1 },
        }, { new: true });
        if (!message) {
            throw new HttpError(400, "You can't delete this message or message not found!");
        }
        const senderSocketId = getSocketId(message?.sender.toString());
        const receiverSocketId = getSocketId(message?.recipient.toString());
        if (receiverSocketId.length > 0) {
            io.to(receiverSocketId).emit("message:remove", message);
        }
        io.to(senderSocketId).emit("message:remove", message);
        return SuccessResponse(res, 200, "Message deleted successfully!", message);
    }
    catch (error) {
        return ErrorResponse(res, error.code || 500, error.message || "Error while deleting message!");
    }
};
const editMessage = async (req, res) => {
    try {
        const uid = req.user?._id;
        const mid = req.params.id;
        const { text } = req.body;
        if (!text) {
            throw new HttpError(400, "Text content is required for editing!");
        }
        const message = await Message.findOneAndUpdate({ _id: mid, sender: uid, "content.type": "text" }, {
            type: "edited",
            "content.text": text,
        }, { new: true });
        if (!message) {
            throw new HttpError(400, "You can't edit this message or message not found!");
        }
        const senderSocketId = getSocketId(message?.sender.toString());
        const receiverSocketId = getSocketId(message?.recipient.toString());
        if (receiverSocketId.length > 0) {
            io.to(receiverSocketId).emit("message:edited", message);
        }
        io.to(senderSocketId).emit("message:edited", message);
        return SuccessResponse(res, 200, "Message edited successfully!", message);
    }
    catch (error) {
        return ErrorResponse(res, error.code || 500, error.message || "Error while editing message!");
    }
};
const deleteMessages = async (req, res) => {
    try {
        const uid = req.user?._id;
        const hoursAgo = new Date();
        hoursAgo.setHours(hoursAgo.getHours() - 24);
        const result = await Message.deleteMany({
            $or: [{ sender: uid }, { recipient: uid }],
            createdAt: { $lt: hoursAgo },
        });
        return SuccessResponse(res, 200, "Older messages deleted!", result);
    }
    catch (error) {
        return ErrorResponse(res, error.code || 500, error.message || "Error while deleting messages!");
    }
};
const translateMessage = async (req, res) => {
    try {
        const { message, language } = req.body;
        if (!message || !language) {
            throw new HttpError(400, "Text message and language is required!");
        }
        const result = await translate(message, null, language);
        if (!result) {
            throw new HttpError(500, "Error while translating message!");
        }
        return SuccessResponse(res, 200, "Text translated successfully!", result.translation);
    }
    catch (error) {
        return ErrorResponse(res, error.code || 500, error.message || "Error while translating message!");
    }
};
export { sendMessage, getMessages, editMessage, deleteMessage, deleteMessages, translateMessage, };
