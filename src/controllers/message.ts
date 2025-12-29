import { translate } from "bing-translate-api";
import { Types } from "mongoose";

import { fetchMembers } from "#/controllers/group.js";
import { Message, Conversation, Group } from "#/models/index.js";
import { getSocketId, io } from "#/server.js";
import { HttpError, SuccessResponse, ErrorResponse } from "#/utils/response.js";

import type { MessageInterface } from "#/interface/index.js";
import type { Message as MessageType, Translate } from "#/utils/schema.js";
import type { Request, Response } from "express";

const sendMessage = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const sender = req.user?._id!;
    const receiver = new Types.ObjectId(req.params.id);
    const { type, text, file, reply } = (await req.body) as MessageType;

    const message = await Message.create({
      sender: sender,
      recipient: receiver,
      content: {
        type: type,
        text: text,
        file: file,
      },
      reply: reply && new Types.ObjectId(reply),
    });

    const interaction = new Date(Date.now());
    const socketEventInfo = [
      { userId: message.sender.toString(), targetId: message.recipient?.toString()! },
      { userId: message.recipient?.toString()!, targetId: message.sender.toString() },
    ];

    for (const { userId, targetId } of socketEventInfo) {
      const userSocketIds = getSocketId(userId);

      if (userSocketIds.length > 0) {
        /** for update new message */
        io.to(userSocketIds).emit("message:receive", message);

        /** for update last chat contact */
        io.to(userSocketIds).emit("conversation:updated", {
          _id: targetId,
          type: "contact",
          interaction,
        });
      }
    }

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
        models: "User",
        interaction: interaction,
      });
    }

    return SuccessResponse(res, 201, "Message sent successfully!", message);
  } catch (error: any) {
    return ErrorResponse(res, error.code || 500, error.message || "Error while sending message!");
  }
};

/** Transform null → undefined in response payload only */
const nullToUndefined = (obj: Record<string, any>) => {
  for (const key in obj) {
    if (obj[key] === null) obj[key] = undefined;
    else if (typeof obj[key] === "object" && obj[key] !== null) nullToUndefined(obj[key]);
  }
  return obj;
};

const getMessages = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const sender = req.user?._id;
    const target = req.params.id;
    const isGroup = (req.query.group as string) === "true" || false;

    const query = isGroup
      ? { group: target }
      : {
          $or: [
            { sender: sender, recipient: target },
            { sender: target, recipient: sender },
          ],
        };

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .lean({ transform: (doc) => nullToUndefined(doc) });

    return SuccessResponse(res, 200, "Messages fetched successfully!", messages.reverse());
  } catch (error: any) {
    return ErrorResponse(res, error.code || 500, error.message || "Error while fetching messages!");
  }
};

const fetchMessages = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const sender = req.user?._id;
    const target = req.params.id;
    const { before, group, limit = 10 } = req.query;

    let isGroup = (group as string) === "true" || false;

    if (!before && !group) {
      const exists = await Group.exists({ _id: target });
      if (exists) isGroup = true;
    }

    const query: any = isGroup
      ? { group: target }
      : {
          $or: [
            { sender: sender, recipient: target },
            { sender: target, recipient: sender },
          ],
        };

    if (before) {
      query.createdAt = { $lt: new Date(before as string) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit as number)
      .lean({ transform: (doc) => nullToUndefined(doc) });

    /* Reverse to show oldest → newest in UI */
    return SuccessResponse(res, 200, "Messages fetched successfully!", messages.reverse());
  } catch (error: any) {
    return ErrorResponse(res, error.code || 500, error.message || "Error while fetching messages!");
  }
};

const messageActionsEvents = async (message: MessageInterface, event: string) => {
  if (message.group) {
    const members = await fetchMembers(message.group);
    const socketIds = members.flatMap((member) => getSocketId(member)).filter(Boolean);
    io.to(socketIds).emit(event, message);
  } else {
    const socketIds = [message.sender, message.recipient!]
      .flatMap((uid) => getSocketId(uid.toString()))
      .filter(Boolean);
    io.to(socketIds).emit(event, message);
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
    ).lean<MessageInterface>({ transform: (doc) => nullToUndefined(doc) });

    if (!message) {
      throw new HttpError(400, "You can't delete this message or message not found!");
    }

    await messageActionsEvents(message, "message:remove");

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
    ).lean<MessageInterface>({ transform: (doc) => nullToUndefined(doc) });

    if (!message) {
      throw new HttpError(400, "You can't edit this message or message not found!");
    }

    await messageActionsEvents(message, "message:edited");

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
                          // { $concatArrays: ["$content.reactions", [{ by, emoji }]] }, // add new
                          { $concatArrays: [{ $ifNull: ["$content.reactions", []] }, [{ by, emoji }]] },
                          {
                            $map: {
                              // input: "$content.reactions",
                              input: { $ifNull: ["$content.reactions", []] },
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
      { new: true, updatePipeline: true }
    ).lean<MessageInterface>({ transform: (doc) => nullToUndefined(doc) });

    if (!message) {
      throw new HttpError(400, "Unable to react on this message or message not found!");
    }

    await messageActionsEvents(message, "message:reacted");

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
