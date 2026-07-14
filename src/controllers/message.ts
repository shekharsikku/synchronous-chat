import { translate } from "bing-translate-api";
import { Types } from "mongoose";
import { fetchMembers } from "#/controllers/group.js";
import type { ConversationDocument, MessageDocument, MessageType, MessageContent } from "#/models/index.js";
import { Message, Conversation } from "#/models/index.js";
import { getSockets, emitEvent } from "#/server.js";
import { sendPushNotification } from "#/utilities/push.js";
import { asyncHandler, HttpError, HttpResponse } from "#/utilities/response.js";
import type { Message as MessageSchema, Translate } from "#/utilities/schema.js";

const buildContent = ({ type, text, file }: MessageContent) => {
  if (type === "text" && text) return { type, text };
  if (type === "file" && file) return { type, file };
  return { type };
};

const emitMessage = (
  sockets: string[],
  message: MessageDocument,
  targetId: string,
  targetType: "contact" | "group",
  interaction: Date
) => {
  emitEvent(sockets, "message:receive", message);
  emitEvent(sockets, "conversation:updated", {
    _id: targetId,
    type: targetType,
    interaction,
  });
};

const resolveMembers = async (
  conversation: ConversationDocument | null,
  groupId: Types.ObjectId
): Promise<string[]> => {
  if (conversation) {
    const populated = await conversation.populate("participants");
    const members = (populated.participants?.[0] as { members?: Types.ObjectId[] })?.members ?? [];
    if (members.length) return members.map((id) => id.toString());
  }
  return fetchMembers(groupId);
};

export const sendMessage = asyncHandler<{ id: string }, {}, MessageSchema, { type?: string }>(async (req) => {
  const senderId = req.user?._id!;
  const receiverId = new Types.ObjectId(req.params.id);
  const isGroup = req.query.type === "group";
  const { type, text, file, reply } = req.body;
  const interaction = new Date();

  let [message, conversation] = await Promise.all([
    Message.create({
      sender: senderId,
      ...(isGroup ? { group: receiverId } : { recipient: receiverId }),
      content: buildContent({ type, text, file }),
      ...(reply && { reply: new Types.ObjectId(reply) }),
    }),
    Conversation.findOneAndUpdate(
      {
        participants: isGroup ? { $size: 1, $all: [receiverId] } : { $all: [senderId, receiverId] },
        models: isGroup ? "Group" : "User",
      },
      { interaction: interaction },
      { returnDocument: "after" }
    ),
  ]);

  if (!conversation) {
    conversation = await Conversation.create({
      participants: isGroup ? [receiverId] : [senderId, receiverId],
      models: isGroup ? "Group" : "User",
      interaction: interaction,
    });
  }

  if (isGroup) {
    const groupMembers = await resolveMembers(conversation, receiverId);
    const membersSockets = groupMembers.flatMap(getSockets).filter(Boolean);
    emitMessage(membersSockets, message, receiverId.toString(), "group", interaction);
  } else {
    const messageSender = message.sender.toString();
    const messageRecipient = message.recipient?.toString()!;
    const senderSockets = getSockets(messageSender);
    const recipientSockets = getSockets(messageRecipient);

    if (senderSockets.length) {
      emitMessage(senderSockets, message, messageRecipient, "contact", interaction);
    }

    if (recipientSockets.length) {
      emitMessage(recipientSockets, message, messageSender, "contact", interaction);
    } else {
      sendPushNotification(receiverId, {
        title: req.user?.name ?? req.user?.username ?? "Someone",
        body: "Sent you a new message.",
        data: { sid: messageSender },
      }).catch(() => {});
    }
  }

  return new HttpResponse(201, "Message sent successfully!", { data: message });
});

/** Transform null → undefined in response payload only */
const nullToUndefined = (obj: Record<string, any>) => {
  for (const key in obj) {
    if (obj[key] === null) obj[key] = undefined;
    else if (typeof obj[key] === "object" && obj[key] !== null) nullToUndefined(obj[key]);
  }
  return obj;
};

export const getMessages = asyncHandler<{ id: string }, {}, {}, { group?: string }>(async (req) => {
  const sender = req.user?._id!;
  const target = req.params.id;
  const isGroup = req.query.group === "true";

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
    .limit(20)
    .lean({ transform: (doc) => nullToUndefined(doc) });

  return new HttpResponse(200, "Messages fetched successfully!", { data: messages.reverse() });
});

export const fetchMessages = asyncHandler<{ id: string }, {}, {}, { before?: string; group?: string; limit?: string }>(
  async (req) => {
    const sender = req.user?._id!;
    const target = req.params.id;
    const { before, group, limit = 10 } = req.query;
    const isGroup = group === "true";

    const query: any = isGroup
      ? { group: target }
      : {
          $or: [
            { sender: sender, recipient: target },
            { sender: target, recipient: sender },
          ],
        };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean({ transform: (doc) => nullToUndefined(doc) });

    /* Reverse to show oldest → newest in UI */
    return new HttpResponse(200, "Messages fetched successfully!", { data: messages.reverse() });
  }
);

const messageActionsEvents = async (message: MessageType, event: string) => {
  if (message.group) {
    const members = await fetchMembers(message.group);
    const sockets = members.flatMap(getSockets).filter(Boolean);
    emitEvent(sockets, event, message);
  } else {
    const sockets = [message.sender, message.recipient!].flatMap((uid) => getSockets(uid.toString())).filter(Boolean);
    emitEvent(sockets, event, message);
  }
};

export const deleteMessage = asyncHandler<{ id: string }>(async (req) => {
  const userId = req.user?._id!;
  const msgId = req.params.id;

  const message = await Message.findOneAndUpdate(
    { _id: msgId, sender: userId },
    {
      type: "deleted",
      deletedAt: new Date(),
      $unset: { content: 1 },
    },
    { returnDocument: "after" }
  ).lean({ transform: (doc) => nullToUndefined(doc) });

  if (!message) {
    throw new HttpError(400, "You can't delete this message!");
  }

  await messageActionsEvents(message, "message:remove");

  return new HttpResponse(200, "Message deleted successfully!", { data: message });
});

export const editMessage = asyncHandler<{ id: string }, {}, { text: string }>(async (req) => {
  const userId = req.user?._id!;
  const msgId = req.params.id;
  const { text } = req.body;

  if (!text.trim()) {
    throw new HttpError(400, "Text content is required for editing!");
  }

  const message = await Message.findOneAndUpdate(
    { _id: msgId, sender: userId, "content.type": "text" },
    {
      type: "edited",
      "content.text": text,
    },
    { returnDocument: "after" }
  ).lean({ transform: (doc) => nullToUndefined(doc) });

  if (!message) {
    throw new HttpError(400, "You can't edit this message!");
  }

  await messageActionsEvents(message, "message:edited");

  return new HttpResponse(200, "Message edited successfully!", { data: message });
});

export const reactMessage = asyncHandler<{ id: string }, {}, { emoji: string }>(async (req) => {
  const by = req.user?._id!;
  const mid = req.params.id;
  const { emoji } = req.body;

  if (!emoji) {
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
                        {
                          $concatArrays: [{ $ifNull: ["$content.reactions", []] }, [{ by, emoji }]],
                        },
                        {
                          $map: {
                            // input: "$content.reactions",
                            input: { $ifNull: ["$content.reactions", []] },
                            as: "r",
                            in: {
                              $cond: [
                                {
                                  $and: [{ $eq: ["$$r.by", by] }, { $eq: ["$$r.emoji", emoji] }],
                                },
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
    { returnDocument: "after", updatePipeline: true }
  ).lean({ transform: (doc) => nullToUndefined(doc) });

  if (!message) {
    throw new HttpError(400, "Unable to react on this message!");
  }

  await messageActionsEvents(message, "message:reacted");

  return new HttpResponse(200, "Message reacted successfully!", { data: message });
});

export const deleteMessages = asyncHandler<{}, {}, {}, { before?: string }>(async (req) => {
  const userId = req.user?._id!;
  const before = Number(req.query.before ?? 1) * 24;

  const hoursAgo = new Date();
  hoursAgo.setHours(hoursAgo.getHours() - before);

  const result = await Message.deleteMany({
    $or: [{ sender: userId }, { recipient: userId }],
    createdAt: { $lt: hoursAgo },
  });

  return new HttpResponse(200, "Older messages deleted!", { data: result });
});

export const translateMessage = asyncHandler<{}, {}, Translate>(async (req) => {
  const { message, language } = req.body;

  if (!message || !language) {
    throw new HttpError(400, "Text message and language is required!");
  }

  const result = await translate(message, null, language);

  if (!result) {
    throw new HttpError(500, "Error while translating message!");
  }

  return new HttpResponse(200, "Text translated successfully!", { data: result.translation });
});
