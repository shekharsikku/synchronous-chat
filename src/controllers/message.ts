import { Request, Response } from "express";
import { ApiResponse, ApiError } from "../utils";
import { getSocketId, io } from "../socket";
import { model, Types } from "mongoose";
import Conversation from "../models/conversation";
import Message from "../models/message";

const sendMessage = async (req: Request, res: Response) => {
  try {
    const senderId = req.user?._id;
    const { id: receiverId } = req.params;
    const { type, message, file } = await req.body;

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    const newMessage = new Message({
      sender: senderId,
      recipient: receiverId,
      messageType: type,
      textMessage: message,
      fileUrl: file,
    });

    if (newMessage) {
      conversation.messages.push(newMessage._id);
    }

    await Promise.all([conversation.save(), newMessage.save()]);
    const receiverSocketId = getSocketId(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }
    return ApiResponse(req, res, 201, "Message sent successfully!", newMessage);
  } catch (error: any) {
    return ApiResponse(req, res, 500, "Something Went Wrong!");
  }
};

async function cleanupConversation(documentId: Types.ObjectId) {
  const conversations = await Conversation.findById(documentId);

  if (conversations) {
    const validMessages = [];

    for (const messageId of conversations.messages) {
      const messageExists = await model("Message").exists({ _id: messageId });
      if (messageExists) {
        validMessages.push(messageId);
      }
    }

    conversations.messages = validMessages;
    await conversations.save();
  }
}

const getMessages = async (req: Request, res: Response) => {
  try {
    const senderId = req.user?._id;
    const { id: userToChatId } = req.params;

    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, userToChatId] },
    }).populate("messages");

    if (!conversation) {
      return ApiResponse(req, res, 200, "No any message available!", []);
    }

    await cleanupConversation(conversation._id);
    const messages = conversation.messages;

    return ApiResponse(
      req,
      res,
      200,
      "Messages fetched successfully!",
      messages
    );
  } catch (error: any) {
    return ApiResponse(req, res, 500, "Something Went Wrong!");
  }
};

const deleteMessage = async (req: Request, res: Response) => {
  try {
    const senderId = req.user?._id;
    const { id: messageId } = req.params;

    const currentMessage = await Message.findById(messageId);

    if (!currentMessage) {
      throw new ApiError(404, "Message not found");
    }

    const senderSocketId = getSocketId(String(currentMessage?.sender))!;
    const receiverSocketId = getSocketId(String(currentMessage?.recipient))!;

    if (currentMessage && currentMessage.sender?.equals(senderId)) {
      currentMessage.messageType === "text"
        ? (currentMessage.textMessage = "")
        : (currentMessage.fileUrl = "");

      await currentMessage.save({ validateBeforeSave: false });

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("messageRemove", currentMessage);
      }
      io.to(senderSocketId).emit("messageRemove", currentMessage);

      // this will emit event to all active clients
      // io.emit("messageRemove", currentMessage);

      return ApiResponse(
        req,
        res,
        200,
        "Message deleted successfully!",
        currentMessage
      );
    } else {
      throw new ApiError(403, "You can't delete this message!");
    }
  } catch (error: any) {
    return ApiResponse(req, res, error.code, error.message);
  }
};

const deleteMessages = async (req: Request, res: Response) => {
  try {
    const hoursAgo = new Date();
    hoursAgo.setHours(hoursAgo.getHours() - 24);

    const result = await Message.deleteMany({
      createdAt: { $lt: hoursAgo },
    });

    return ApiResponse(req, res, 200, "Older messages deleted!", result);
  } catch (error: any) {
    console.log(`Error: ${error.message}`);
  }
};

export { sendMessage, getMessages, deleteMessage, deleteMessages };
