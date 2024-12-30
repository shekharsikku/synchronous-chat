import { ApiResponse, ApiError } from "../utils";
import { Request, Response } from "express";
import { getSocketId, io } from "../socket";
import { Types } from "mongoose";
import Conversation from "../models/conversation";
import Message from "../models/message";
import { translate } from "bing-translate-api";

const sendMessage = async (req: Request, res: Response) => {
  try {
    const sender = req.user?._id;
    const receiver = req.params.id;
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
      conversation.interaction = new Date(Date.now());
    }

    await Promise.all([conversation.save(), message.save()]);
    const senderSocketId = getSocketId(String(sender));
    const receiverSocketId = getSocketId(receiver);

    if (receiverSocketId.size > 0) {
      const receiverSockets = Array.from(receiverSocketId);

      /** for update new message */
      io.to(receiverSockets).emit("message:receive", message);

      /** for update last chat contact */
      io.to(receiverSockets).emit("conversation:updated", {
        _id: sender,
        interaction: conversation.interaction,
      });
    }

    const senderSockets = Array.from(senderSocketId);

    /** for update new message */
    io.to(senderSockets).emit("message:receive", message);

    /** for update last chat contact */
    io.to(senderSockets).emit("conversation:updated", {
      _id: receiver,
      interaction: conversation.interaction,
    });

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
    const receiver = req.params.id;

    const conversation = await Conversation.findOne({
      participants: { $all: [sender, receiver] },
    })
      .populate("messages")
      .lean();

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
    const mid = req.params.id;

    const message = await Message.findById(mid);

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
        io.to(Array.from(receiverSocketId)).emit("message:remove", message);
      }
      io.to(Array.from(senderSocketId)).emit("message:remove", message);

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

const translateMessage = async (req: Request, res: Response) => {
  try {
    const { message, language } = await req.body;

    const result = await translate(message, null, language);

    if (!result) {
      throw new ApiError(500, "Error while translating text!");
    }

    return ApiResponse(
      res,
      200,
      "Text translated successfully!",
      result.translation
    );
  } catch (error: any) {
    return ApiResponse(res, error.code, error.message);
  }
};

export {
  sendMessage,
  getMessages,
  deleteMessage,
  deleteMessages,
  translateMessage,
};
