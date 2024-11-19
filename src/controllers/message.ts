import { ApiResponse, ApiError } from "../utils";
import { Request, Response } from "express";
import { getSocketId, io } from "../socket";
import { Types } from "mongoose";
import Conversation from "../models/conversation";
import Message from "../models/message";

const sendMessage = async (req: Request, res: Response) => {
  try {
    const sender = req.user?._id;
    const { id: receiver } = req.params;
    const { type, text, file } = await req.body;

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
      type: type,
      text: text,
      file: file,
    });

    if (message) {
      conversation.messages.push(message._id);
    }

    await Promise.all([conversation.save(), message.save()]);
    const senderSocketId = getSocketId(String(sender));
    const receiverSocketId = getSocketId(receiver);

    if (receiverSocketId.size > 0) {
      io.to(Array.from(receiverSocketId)).emit("new-message", message);
    }
    io.to(Array.from(senderSocketId)).emit("new-message", message);

    return ApiResponse(res, 201, "Message sent successfully!", message);
  } catch (error: any) {
    return ApiResponse(res, 500, "Something Went Wrong!");
  }
};

/*
const cleanupConversation = async (conversationId: Types.ObjectId) => {
  const conversations = await Conversation.findById(conversationId);

  if (conversations) {
    const validMessages = [];

    for (const message of conversations.messages) {
      const messageExists = await model("Message").exists({ _id: message });

      if (messageExists) {
        validMessages.push(message);
      }
    }

    conversations.messages = validMessages;
    await conversations.save();
  }
}
*/

const cleanupConversation = async (conversationId: Types.ObjectId) => {
  const conversations = await Conversation.findById(conversationId).lean(); // Use lean() for faster retrieval

  if (conversations && conversations.messages.length > 0) {
    const validMessages = await Message.find({
      _id: { $in: conversations.messages }, // Batch check existence of all messages using $in
    }).distinct("_id"); // Only retrieve message IDs

    // Only update if there are messages that were removed
    if (validMessages.length !== conversations.messages.length) {
      await Conversation.updateOne(
        { _id: conversationId },
        { $set: { messages: validMessages } }
      );
    }
  }
};

const getMessages = async (req: Request, res: Response) => {
  try {
    const sender = req.user?._id;
    const { id: receiver } = req.params;

    const conversation = await Conversation.findOne({
      participants: { $all: [sender, receiver] },
    }).populate("messages");

    if (!conversation) {
      return ApiResponse(res, 200, "No any message available!", []);
    }

    await cleanupConversation(conversation._id);
    const messages = conversation.messages;

    return ApiResponse(res, 200, "Messages fetched successfully!", messages);
  } catch (error: any) {
    return ApiResponse(res, 500, "Something Went Wrong!");
  }
};

const deleteMessage = async (req: Request, res: Response) => {
  try {
    const uid = req.user?._id;
    const { id } = req.params;

    const message = await Message.findById(id);

    if (!message) {
      throw new ApiError(404, "Message not found");
    }

    const senderSocketId = getSocketId(String(message?.sender))!;
    const receiverSocketId = getSocketId(String(message?.recipient))!;

    if (message && message.sender?.equals(uid)) {
      message.type === "text" ? (message.text = "") : (message.file = "");
      message.type = "deleted";
      await message.save({ validateBeforeSave: false });

      if (receiverSocketId.size > 0) {
        io.to(Array.from(receiverSocketId)).emit("message-remove", message);
      }
      io.to(Array.from(senderSocketId)).emit("message-remove", message);

      return ApiResponse(res, 200, "Message deleted successfully!", message);
    } else {
      throw new ApiError(403, "You can't delete this message!");
    }
  } catch (error: any) {
    return ApiResponse(res, error.code, error.message);
  }
};

const deleteMessages = async (req: Request, res: Response) => {
  try {
    const uid = req.user?._id;

    const hoursAgo = new Date();
    hoursAgo.setHours(hoursAgo.getHours() - 24);

    const result = await Message.deleteMany({
      $or: [{ sender: uid }, { recipient: uid }],
      createdAt: { $lt: hoursAgo },
    });

    return ApiResponse(res, 200, "Older messages deleted!", result);
  } catch (error: any) {
    console.log(`Error: ${error.message}`);
  }
};

export { sendMessage, getMessages, deleteMessage, deleteMessages };
