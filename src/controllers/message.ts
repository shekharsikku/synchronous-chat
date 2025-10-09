import type { Request, Response } from "express";
import type { Message as MessageType, Translate } from "../utils/schema.js";
import { HttpError, SuccessResponse, ErrorResponse } from "../utils/index.js";
import { getSocketId, io } from "../socket.js";
import { translate } from "bing-translate-api";
import { Message, Conversation } from "../models/index.js";

const sendMessage = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const sender = req.user?._id!;
    const receiver = req.params.id;
    const { type, text, file, reply } = (await req.body) as MessageType;

    const message = await Message.create({
      sender: sender,
      recipient: receiver,
      content: {
        type: type,
        text: text,
        file: file,
      },
      reply: reply || null,
    });

    const interaction = new Date(Date.now());
    const senderSocketId = getSocketId(sender.toString());
    const receiverSocketId = getSocketId(receiver);

    if (receiverSocketId.length > 0) {
      /** for update new message */
      io.to(receiverSocketId).emit("message:receive", message);

      /** for update last chat contact */
      io.to(receiverSocketId).emit("conversation:updated", {
        _id: sender,
        interaction: interaction,
      });
    }

    /** for update new message */
    io.to(senderSocketId).emit("message:receive", message);

    /** for update last chat contact */
    io.to(senderSocketId).emit("conversation:updated", {
      _id: receiver,
      interaction: interaction,
    });

    let conversation = await Conversation.findOneAndUpdate(
      { participants: { $all: [sender, receiver] } },
      {
        interaction: interaction,
      },
      { new: true }
    );

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [sender, receiver],
        interaction: interaction,
      });
    }

    return SuccessResponse(res, 201, "Message sent successfully!", message);
  } catch (error: any) {
    return ErrorResponse(res, error.code || 500, error.message || "Error while sending message!");
  }
};

const getMessages = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const sender = req.user?._id;
    const receiver = req.params.id;

    const messages = await Message.find({
      $or: [
        { sender: sender, recipient: receiver },
        { sender: receiver, recipient: sender },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    return SuccessResponse(res, 200, "Messages fetched successfully!", messages);
  } catch (error: any) {
    return ErrorResponse(res, error.code || 500, error.message || "Error while fetching messages!");
  }
};

const fetchMessages = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const sender = req.user?._id;
    const receiver = req.params.id;
    const { before, limit = 10 } = req.query;

    const query: any = {
      $or: [
        { sender: sender, recipient: receiver },
        { sender: receiver, recipient: sender },
      ],
    };

    if (before) {
      query.createdAt = { $lt: new Date(before as string) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit as number)
      .lean();

    /* Reverse to show oldest → newest in UI */
    return SuccessResponse(res, 200, "Messages fetched successfully!", messages.reverse());
  } catch (error: any) {
    return ErrorResponse(res, error.code || 500, error.message || "Error while fetching messages!");
  }
};

const deleteMessage = async (req: Request<{ id: string }>, res: Response) => {
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
      throw new HttpError(400, "You can't delete this message or message not found!");
    }

    const senderSocketId = getSocketId(message?.sender.toString());
    const receiverSocketId = getSocketId(message?.recipient.toString());

    if (receiverSocketId.length > 0) {
      io.to(receiverSocketId).emit("message:remove", message);
    }
    io.to(senderSocketId).emit("message:remove", message);

    return SuccessResponse(res, 200, "Message deleted successfully!", message);
  } catch (error: any) {
    return ErrorResponse(res, error.code || 500, error.message || "Error while deleting message!");
  }
};

const editMessage = async (req: Request<{ id: string }, {}, { text: string }>, res: Response) => {
  try {
    const uid = req.user?._id;
    const mid = req.params.id;
    const { text } = req.body;

    if (!text) {
      throw new HttpError(400, "Text content is required for editing!");
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
      throw new HttpError(400, "You can't edit this message or message not found!");
    }

    const senderSocketId = getSocketId(message?.sender.toString());
    const receiverSocketId = getSocketId(message?.recipient.toString());

    if (receiverSocketId.length > 0) {
      io.to(receiverSocketId).emit("message:edited", message);
    }
    io.to(senderSocketId).emit("message:edited", message);

    return SuccessResponse(res, 200, "Message edited successfully!", message);
  } catch (error: any) {
    return ErrorResponse(res, error.code || 500, error.message || "Error while editing message!");
  }
};

const reactMessage = async (req: Request<{ id: string }, {}, { by: string; emoji: string }>, res: Response) => {
  try {
    const mid = req.params.id;
    const { by, emoji } = req.body;

    if (!by || !emoji) {
      throw new HttpError(400, "Emoji is required for reacting!");
    }

    const message = await Message.findOneAndUpdate(
      { _id: mid },
      [
        {
          $set: {
            // Step 1: your existing map/remove/add logic
            "content.reactions": {
              $let: {
                vars: {
                  existing: {
                    $filter: {
                      input: { $ifNull: ["$content.reactions", []] },
                      as: "r",
                      cond: { $eq: ["$$r.by", by] },
                    },
                  },
                },
                in: {
                  $let: {
                    vars: {
                      updated: {
                        $cond: [
                          { $eq: [{ $size: "$$existing" }, 0] },
                          { $concatArrays: ["$content.reactions", [{ by, emoji }]] }, // add new
                          {
                            $map: {
                              input: "$content.reactions",
                              as: "r",
                              in: {
                                $cond: [
                                  { $and: [{ $eq: ["$$r.by", by] }, { $eq: ["$$r.emoji", emoji] }] },
                                  "$$REMOVE", // remove same emoji
                                  { $cond: [{ $eq: ["$$r.by", by] }, { by, emoji }, "$$r"] }, // update emoji
                                ],
                              },
                            },
                          },
                        ],
                      },
                    },
                    in: { $ifNull: ["$$updated", []] }, // ensure empty array if all reactions removed
                  },
                },
              },
            },
          },
        },
        // Step 2: Filter out any nulls left in the array
        {
          $set: {
            "content.reactions": {
              $filter: {
                input: "$content.reactions",
                as: "r",
                cond: { $ne: ["$$r", null] }, // remove nulls
              },
            },
          },
        },
      ],
      { new: true }
    );

    const senderSocketId = getSocketId(message?.sender.toString()!);
    const receiverSocketId = getSocketId(message?.recipient.toString()!);

    if (receiverSocketId.length > 0) {
      io.to(receiverSocketId).emit("message:reacted", message);
    }
    io.to(senderSocketId).emit("message:reacted", message);

    return SuccessResponse(res, 200, "Message reacted successfully!", message);
  } catch (error: any) {
    console.log({ error });
    return ErrorResponse(res, error.code || 500, error.message || "Error while reacting message!");
  }
};

const deleteMessages = async (req: Request, res: Response) => {
  try {
    const uid = req.user?._id;
    const before = Number(req.query.before ?? 1) * 24;

    const hoursAgo = new Date();
    hoursAgo.setHours(hoursAgo.getHours() - before);

    const result = await Message.deleteMany({
      $or: [{ sender: uid }, { recipient: uid }],
      createdAt: { $lt: hoursAgo },
    });

    return SuccessResponse(res, 200, "Older messages deleted!", result);
  } catch (error: any) {
    return ErrorResponse(res, error.code || 500, error.message || "Error while deleting messages!");
  }
};

const translateMessage = async (req: Request<{}, {}, Translate>, res: Response) => {
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
  } catch (error: any) {
    return ErrorResponse(res, error.code || 500, error.message || "Error while translating message!");
  }
};

export {
  sendMessage,
  getMessages,
  editMessage,
  reactMessage,
  deleteMessage,
  deleteMessages,
  translateMessage,
  fetchMessages,
};
