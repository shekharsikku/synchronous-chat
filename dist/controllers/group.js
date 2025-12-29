import { Types } from "mongoose";
import { Group, Message, User, Conversation } from "../models/index.js";
import { getSocketId, io } from "../server.js";
import { HttpError, SuccessResponse, ErrorResponse } from "../utils/response.js";
const createGroup = async (req, res) => {
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
        const newGroup = await Group.create({
            name: groupData.name,
            description: groupData.description,
            admin: new Types.ObjectId(groupData.admin),
            members: groupData.members.map((id) => new Types.ObjectId(id)),
        });
        const socketIds = newGroup.members.flatMap((member) => getSocketId(member.toString())).filter(Boolean);
        io.to(socketIds).emit("group:created", {
            ...newGroup.toJSON(),
            interaction: new Date().toISOString(),
        });
        await Conversation.create({ participants: [newGroup._id], models: "Group" });
        return SuccessResponse(res, 200, "Group created successfully!", newGroup);
    }
    catch (error) {
        return ErrorResponse(res, error.code || 500, error.message || "Error while creating group!");
    }
};
const updateDetails = async (req, res) => {
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
        const updatedGroup = await Group.findOneAndUpdate({ _id: groupId, admin: reqUser }, { $set: updateData }, { new: true });
        if (!updatedGroup) {
            throw new HttpError(404, "Group not found or you are not authorized!");
        }
        return SuccessResponse(res, 200, "Group details updated successfully!", updatedGroup);
    }
    catch (error) {
        return ErrorResponse(res, error.code || 500, error.message || "Error while updating group details!");
    }
};
const updateMembers = async (req, res) => {
    try {
        const groupId = req.params.id;
        const { add, remove } = req.body;
        const reqUser = req.user?._id;
        if (!add?.length && !remove?.length) {
            throw new HttpError(400, "Provide at least one member to add or remove!");
        }
        if (remove.includes(reqUser?.toString())) {
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
        const updateOps = {};
        if (add.length)
            updateOps.$addToSet = { members: { $each: add } };
        if (remove.length)
            updateOps.$pull = { members: { $in: remove } };
        const updatedGroup = await Group.findOneAndUpdate({ _id: groupId, admin: reqUser }, updateOps, { new: true });
        if (!updatedGroup) {
            throw new HttpError(404, "Group not found or you are not authorized!");
        }
        return SuccessResponse(res, 200, "Group members updated successfully!", updatedGroup);
    }
    catch (error) {
        return ErrorResponse(res, error.code || 500, error.message || "Error while updating group member!");
    }
};
const fetchGroups = async (req, res) => {
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
                    createdAt: 1,
                    updatedAt: 1,
                    __v: 1,
                    interaction: 1,
                },
            },
        ]);
        return SuccessResponse(res, 200, "Groups fetched successfully!", groups);
    }
    catch (error) {
        return ErrorResponse(res, error.code || 500, error.message || "Error while fetching groups!");
    }
};
export const fetchMembers = async (gid) => {
    const group = await Group.findById(gid).select("-_id members").lean();
    return group?.members.map((id) => id.toString()) || [];
};
const groupMessage = async (req, res) => {
    try {
        const sender = req.user?._id;
        const group = new Types.ObjectId(req.params.id);
        const { type, text, file, reply } = (await req.body);
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
                reply: reply && new Types.ObjectId(reply),
            }),
            Conversation.findOneAndUpdate({ participants: { $all: [group] } }, {
                interaction: interaction,
            }, { new: true }).populate("participants"),
        ]);
        let members = [];
        if (!conversation) {
            [conversation, members] = await Promise.all([
                Conversation.create({
                    participants: [group],
                    models: "Group",
                    interaction: interaction,
                }),
                fetchMembers(group),
            ]);
        }
        else if (!members && conversation.models === "Group") {
            members = (conversation.participants?.[0]).members || [];
        }
        else {
            members = await fetchMembers(group);
        }
        const socketIds = members.flatMap((member) => getSocketId(member)).filter(Boolean);
        io.to(socketIds).emit("message:receive", message);
        io.to(socketIds).emit("conversation:updated", {
            _id: group,
            type: "group",
            interaction,
        });
        return SuccessResponse(res, 201, "Message sent successfully!", message);
    }
    catch (error) {
        return ErrorResponse(res, error.code || 500, error.message || "Error while changing group avatar!");
    }
};
export { createGroup, updateDetails, updateMembers, fetchGroups, groupMessage };
