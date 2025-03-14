import { ApiResponse, ApiError } from "../utils";
import { Request, Response } from "express";
import { getSocketId, io } from "../socket";
import Conversation from "../models/conversation";
import Message from "../models/message";

const sendMessage = async (req: Request, res: Response) => {
  try {
    const sender = req.user?._id!;
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
      /** for update new message */
      io.to(receiverSocketId).emit("message:receive", message);

      /** for update last chat contact */
      io.to(receiverSocketId).emit("conversation:updated", {
        _id: sender,
        interaction: conversation.interaction,
      });
    }

    /** for update new message */
    io.to(senderSocketId).emit("message:receive", message);

    /** for update last chat contact */
    io.to(senderSocketId).emit("conversation:updated", {
      _id: receiver,
      interaction: conversation.interaction,
    });

    return ApiResponse(res, 201, "Message sent successfully!", message);
  } catch (error: any) {
    return ApiResponse(res, 500, "Error while sending message!");
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
    return ApiResponse(res, 500, "Error while fetching messages!");
  }
};
*/

const getMessages = async (req: Request, res: Response) => {
  try {
    const sender = req.user?._id;
    const receiver = req.params.id;

    const messages = await Message.find({
      $or: [
        { sender: sender, recipient: receiver },
        { sender: receiver, recipient: sender },
      ],
    }).distinct("_id");

    const conversation = await Conversation.findOneAndUpdate(
      {
        participants: { $all: [sender, receiver] },
      },
      [
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
      ],
      { new: true }
    )
      .populate("messages")
      .lean();

    if (!conversation) {
      return ApiResponse(res, 200, "No any message available!", []);
    }

    return ApiResponse(
      res,
      200,
      "Messages fetched successfully!",
      conversation?.messages
    );
  } catch (error: any) {
    return ApiResponse(res, 500, "Error while fetching messages!");
  }
};

const deleteMessage = async (req: Request, res: Response) => {
  try {
    const uid = req.user?._id;
    const mid = req.params.id;

    const message = await Message.findOneAndUpdate(
      { _id: mid, sender: uid },
      {
        type: "deleted",
        deletedAt: new Date(),
        $unset: { content: 1 },
      },
      { new: true }
    );

    if (!message) {
      throw new ApiError(
        403,
        "You can't delete this message or message not found!"
      );
    }

    const senderSocketId = getSocketId(message?.sender.toString());
    const receiverSocketId = getSocketId(message?.recipient.toString());

    if (receiverSocketId.length > 0) {
      io.to(receiverSocketId).emit("message:remove", message);
    }
    io.to(senderSocketId).emit("message:remove", message);

    return ApiResponse(res, 200, "Message deleted successfully!", message);
  } catch (error: any) {
    return ApiResponse(
      res,
      error.code || 500,
      error.message || "Error while deleting message!"
    );
  }
};

const editMessage = async (req: Request, res: Response) => {
  try {
    const uid = req.user?._id;
    const mid = req.params.id;
    const { text } = await req.body;

    if (!text) {
      throw new ApiError(400, "Text content is required for editing!");
    }

    const message = await Message.findOneAndUpdate(
      { _id: mid, sender: uid, "content.type": "text" },
      {
        type: "edited",
        "content.text": text,
      },
      { new: true }
    );

    if (!message) {
      throw new ApiError(
        403,
        "You can't edit this message or message not found!"
      );
    }

    const senderSocketId = getSocketId(message?.sender.toString());
    const receiverSocketId = getSocketId(message?.recipient.toString());

    if (receiverSocketId.length > 0) {
      io.to(receiverSocketId).emit("message:edited", message);
    }
    io.to(senderSocketId).emit("message:edited", message);

    return ApiResponse(res, 200, "Message edited successfully!", message);
  } catch (error: any) {
    return ApiResponse(
      res,
      error.code || 500,
      error.message || "Error while editing message!"
    );
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
    return ApiResponse(res, 500, "Error while deleting messages!");
  }
};

export { sendMessage, getMessages, editMessage, deleteMessage, deleteMessages };
