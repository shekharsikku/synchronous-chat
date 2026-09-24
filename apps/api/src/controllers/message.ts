import { Types } from "mongoose";
import { fetchMembers } from "#/controllers/group.js";
import { requireUserId } from "#/controllers/user.js";
import type { ConversationDocument, MessageContent } from "#/models/index.js";
import { Message, Conversation, Group } from "#/models/index.js";
import { getSockets, emitEvent } from "#/server.js";
import { toMessageInfo, type MessageInfo } from "#/utilities/helpers.js";
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
  message: MessageInfo,
  targetId: string,
  targetType: "contact" | "group",
  interaction: Date
) => {
  emitEvent(sockets, "message:receive", message);
  emitEvent(sockets, "conversation:updated", {
    id: targetId,
    type: targetType,
    interaction,
  });
};

const resolveMembers = async (conversation: ConversationDocument | null, groupId: string): Promise<string[]> => {
  if (conversation) {
    const populated = await conversation.populate("participants");
    const members = (populated.participants?.[0] as { members?: Types.ObjectId[] })?.members ?? [];
    if (members.length) return members.map((id) => id.toString());
  }
  return fetchMembers(groupId);
};

export const sendMessage = asyncHandler<{ id: string }, {}, MessageSchema, { type?: string }>(async (req, res) => {
  const senderId = requireUserId(req);
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
    }).then((msg) => toMessageInfo(msg)),
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

  if (isGroup && message.group) {
    const groupMembers = await resolveMembers(conversation, message.group);
    const membersSockets = groupMembers.flatMap(getSockets).filter(Boolean);
    emitMessage(membersSockets, message, receiverId.toString(), "group", interaction);
  } else {
    const messageSender = message.sender;
    const messageRecipient = message.recipient!;
    const senderSockets = getSockets(messageSender);
    const recipientSockets = getSockets(messageRecipient);

    if (senderSockets.length) {
      emitMessage(senderSockets, message, messageRecipient, "contact", interaction);
    }

    if (recipientSockets.length) {
      emitMessage(recipientSockets, message, messageSender, "contact", interaction);
    } else {
      sendPushNotification(receiverId, {
        title: "Someone",
        body: "Sent you a new message.",
        data: { sid: messageSender },
      });
    }
  }

  return HttpResponse.success(res, 201, "Message sent successfully!");
});

// /** Transform null → undefined in response payload only */
// const nullToUndefined = (obj: Record<string, any>) => {
//   for (const key in obj) {
//     if (obj[key] === null) obj[key] = undefined;
//     else if (typeof obj[key] === "object" && obj[key] !== null) nullToUndefined(obj[key]);
//   }
//   return obj;
// };

const memberExists = async (group: string, member: string) => {
  if (!(await Group.exists({ _id: group, members: member }))) {
    throw new HttpError(400, "Group not found or not a member");
  }
};

export const getMessages = asyncHandler<{ id: string }, {}, {}, { member?: string }>(async (req, res) => {
  const sender = requireUserId(req);
  const target = req.params.id;
  const member = req.query.member;

  if (member) {
    await memberExists(target, member);
  }

  const query: any = member
    ? { group: target }
    : {
        $or: [
          { sender: sender, recipient: target },
          { sender: target, recipient: sender },
        ],
      };

  const messages = await Message.find(query).sort({ createdAt: -1 }).limit(20);

  return HttpResponse.success(res, 200, "Messages fetched successfully!", messages.reverse().map(toMessageInfo));
});

export const fetchMessages = asyncHandler<{ id: string }, {}, {}, { before?: string; member?: string; limit?: string }>(
  async (req, res) => {
    const sender = requireUserId(req);
    const target = req.params.id;
    const { before, member, limit = 20 } = req.query;

    if (member) {
      await memberExists(target, member);
    }

    const query: any = member
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

    const messages = await Message.find(query).sort({ createdAt: -1 }).limit(Number(limit));

    /* Reverse to show oldest → newest in UI */
    return HttpResponse.success(res, 200, "Messages fetched successfully!", messages.reverse().map(toMessageInfo));
  }
);

const messageActionsEvents = async (message: MessageInfo, event = "message:update") => {
  if (message.group) {
    const members = await fetchMembers(message.group);
    const sockets = members.flatMap(getSockets).filter(Boolean);
    emitEvent(sockets, event, message);
  } else {
    const sockets = [message.sender, message.recipient!].flatMap(getSockets).filter(Boolean);
    emitEvent(sockets, event, message);
  }
};

export const deleteMessage = asyncHandler<{ id: string }>(async (req, res) => {
  const userId = requireUserId(req);
  const msgId = req.params.id;

  const message = await Message.findOneAndUpdate(
    { _id: msgId, sender: userId },
    {
      type: "deleted",
      deletedAt: new Date(),
      $unset: { content: 1 },
    },
    { returnDocument: "after" }
  );

  if (!message) {
    throw new HttpError(400, "You can't delete this message!");
  }

  await messageActionsEvents(toMessageInfo(message));

  return HttpResponse.success(res, 200, "Message deleted successfully!");
});

export const editMessage = asyncHandler<{ id: string }, {}, { text: string }>(async (req, res) => {
  const userId = requireUserId(req);
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
  );

  if (!message) {
    throw new HttpError(400, "You can't edit this message!");
  }

  await messageActionsEvents(toMessageInfo(message));

  return HttpResponse.success(res, 200, "Message edited successfully!");
});

export const reactMessage = asyncHandler<{ id: string }, {}, { emoji: string }>(async (req, res) => {
  const by = requireUserId(req).toString();
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
                        {
                          $concatArrays: [{ $ifNull: ["$content.reactions", []] }, [{ by, emoji }]],
                        },
                        {
                          $map: {
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
  );

  if (!message) {
    throw new HttpError(400, "Unable to react on this message!");
  }

  await messageActionsEvents(toMessageInfo(message));

  return HttpResponse.success(res, 200, "Message reacted successfully!");
});

export const deleteMessages = asyncHandler<{}, {}, {}, { before?: string }>(async (req, res) => {
  const userId = requireUserId(req);
  const before = Number(req.query.before ?? 1) * 24;

  const hoursAgo = new Date();
  hoursAgo.setHours(hoursAgo.getHours() - before);

  const result = await Message.deleteMany({
    $or: [{ sender: userId }, { recipient: userId }],
    createdAt: { $lt: hoursAgo },
  });

  return HttpResponse.success(res, 200, "Older messages deleted!", result);
});

export const translateMessage = asyncHandler<{}, {}, Translate>(async (req, res) => {
  return HttpResponse.success(res, 200, "Translation feature will be added!", req.body.message);
});
