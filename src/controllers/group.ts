import type { Request, Response } from "express";
import type { CreateGroupType, UpdateDetailsType, UpdateMembersType, Message as MessageType } from "../utils/schema.js";
import { HttpError, SuccessResponse, ErrorResponse } from "../utils/index.js";
import { Group, Message, User, Conversation } from "../models/index.js";
import { getSocketId, io } from "../socket.js";
import { Types } from "mongoose";

const createGroup = async (req: Request<{}, {}, CreateGroupType>, res: Response) => {
  try {
    const groupData = req.body;
    const reqUser = req.user?._id;

    if (groupData.admin !== reqUser?.toString()) {
      throw new HttpError(400, "Invalid group admin assignment!");
    }

    if (!groupData.members.includes(reqUser.toString())) {
      groupData.members.push(reqUser.toString());
    }

    groupData.members = [...new Set(groupData.members)];

    const [existingGroup, existingUsers] = await Promise.all([
      Group.exists({ name: groupData.name, admin: reqUser }),
      User.find({ _id: { $in: groupData.members } }).select("_id"),
    ]);

    if (existingGroup) {
      throw new HttpError(400, "You already have a group with this name!");
    }

    if (existingUsers.length !== groupData.members.length) {
      throw new HttpError(400, "One or more members are invalid users!");
    }

    const newGroup = await Group.create(groupData);
    await Conversation.create({ participants: [newGroup._id], models: "Group" });

    return SuccessResponse(res, 200, "Group created successfully!", newGroup);
  } catch (error: any) {
    return ErrorResponse(res, error.code || 500, error.message || "Error while creating group!");
  }
};

const updateDetails = async (req: Request<{ id: string }, {}, UpdateDetailsType>, res: Response) => {
  try {
    const groupId = req.params.id;
    const updateData = req.body;
    const reqUser = req.user?._id;

    if (updateData.name) {
      const existingGroup = await Group.exists({ name: updateData.name, admin: reqUser, _id: { $ne: groupId } });

      if (existingGroup) {
        throw new HttpError(400, "You already have another group with this name!");
      }
    }

    const updatedGroup = await Group.findOneAndUpdate(
      { _id: groupId, admin: reqUser },
      { $set: updateData },
      { new: true }
    );

    if (!updatedGroup) {
      throw new HttpError(404, "Group not found or you are not authorized!");
    }

    return SuccessResponse(res, 200, "Group details updated successfully!", updatedGroup);
  } catch (error: any) {
    return ErrorResponse(res, error.code || 500, error.message || "Error while updating group details!");
  }
};

const updateMembers = async (req: Request<{ id: string }, {}, UpdateMembersType>, res: Response) => {
  try {
    const groupId = req.params.id;
    const { add, remove } = req.body;
    const reqUser = req.user?._id;

    if (!add?.length && !remove?.length) {
      throw new HttpError(400, "Provide at least one member to add or remove!");
    }

    if (remove.includes(reqUser?.toString()!)) {
      throw new HttpError(400, "Admin cannot be removed from the group!");
    }

    const updateMembers = [...add, ...remove];

    if (updateMembers.length > 0) {
      const existingUsers = await User.find({ _id: { $in: updateMembers } }).select("_id");
      const validUserIds = existingUsers.map((cur) => cur._id.toString());
      const invalidIds = updateMembers.filter((cur) => !validUserIds.includes(cur));

      if (invalidIds.length > 0) {
        throw new HttpError(400, `Invalid user IDs: ${invalidIds.join(", ")}`);
      }
    }

    const updateOps: any = {};

    if (add.length) updateOps.$addToSet = { members: { $each: add } };
    if (remove.length) updateOps.$pull = { members: { $in: remove } };

    const updatedGroup = await Group.findOneAndUpdate({ _id: groupId, admin: reqUser }, updateOps, { new: true });

    if (!updatedGroup) {
      throw new HttpError(404, "Group not found or you are not authorized!");
    }

    return SuccessResponse(res, 200, "Group members updated successfully!", updatedGroup);
  } catch (error: any) {
    return ErrorResponse(res, error.code || 500, error.message || "Error while updating group member!");
  }
};

// const removeAvatar = (req: Request, res: Response) => {
//   try {
//   } catch (error: any) {
//     return ErrorResponse(res, error.code || 500, error.message || "Error while removing group avatar!");
//   }
// };

const fetchGroups = async (req: Request, res: Response) => {
  try {
    const uid = new Types.ObjectId(req.user?._id);

    const groups = await Group.aggregate([
      { $match: { members: uid } },
      {
        $lookup: {
          from: "conversations",
          localField: "_id",
          foreignField: "participants",
          as: "conversation",
        },
      },
      {
        $addFields: {
          interaction: { $arrayElemAt: ["$conversation.interaction", 0] },
        },
      },
      {
        $project: {
          name: 1,
          description: 1,
          avatar: 1,
          admin: 1,
          members: 1,
          // createdAt: 1,
          // updatedAt: 1,
          // __v: 1
          interaction: 1,
        },
      },
    ]);

    return SuccessResponse(res, 200, "Groups fetched successfully!", groups);
  } catch (error: any) {
    return ErrorResponse(res, error.code || 500, error.message || "Error while fetching groups!");
  }
};

export const fetchMembers = async (gid: string) => {
  const group = await Group.findById(gid).select("-_id members").lean();
  return group?.members.map((id) => id.toString()) || [];
};

const groupMessage = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const sender = req.user?._id!;
    const group = req.params.id;
    const { type, text, file, reply } = (await req.body) as MessageType;

    const interaction = new Date(Date.now());

    let [message, conversation] = await Promise.all([
      Message.create({
        sender: sender,
        group: group,
        content: {
          type: type,
          text: text,
          file: file,
        },
        reply: reply || null,
      }),
      Conversation.findOneAndUpdate(
        { participants: { $all: [group] } },
        {
          interaction: interaction,
        },
        { new: true }
      ).populate("participants"),
    ]);

    let members: string[] = [];

    /* If no conversation, create one and fetch members manually */
    if (!conversation) {
      [conversation, members] = await Promise.all([
        Conversation.create({
          participants: [group],
          models: "Group",
          interaction: interaction,
        }),
        fetchMembers(group),
      ]);
    } else if (!members && conversation.models === "Group") {
      members = (conversation.participants?.[0] as any).members || [];
    } else {
      members = await fetchMembers(group);
    }

    const socketIds = members.flatMap((member) => getSocketId(member)) || [];

    socketIds.forEach((sid) => {
      io.to(sid).emit("message:receive", message);
      io.to(socketIds).emit("conversation:updated", {
        _id: group,
        type: "group",
        interaction: interaction,
      });
    });

    return SuccessResponse(res, 201, "Message sent successfully!", message);
  } catch (error: any) {
    return ErrorResponse(res, error.code || 500, error.message || "Error while changing group avatar!");
  }
};

export { createGroup, updateDetails, updateMembers, fetchGroups, groupMessage };
