import { Types } from "mongoose";
import { ApiError, ApiResponse, asyncHandler } from "#/utils/helpers.js";
import { Group, User, Conversation } from "#/models/index.js";
import { getSocketId, io } from "#/server.js";
import { deleteFromCloudinary, uploadToCloudinary } from "#/utils/cloudinary.js";
import type { CreateGroup, UpdateDetails, UpdateMembers } from "#/utils/schema.js";

export const createGroup = asyncHandler<{}, {}, CreateGroup>(async (req) => {
  const groupData = req.body;
  const reqUser = req.user?._id;

  if (groupData.admin !== reqUser?.toString()) {
    throw new ApiError(400, "Invalid group admin assignment!");
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
    throw new ApiError(400, "You already have a group with this name!");
  }

  if (existingUsers.length !== groupData.members.length) {
    throw new ApiError(400, "One or more members are invalid users!");
  }

  const newGroup = await Group.create({
    name: groupData.name,
    description: groupData.description,
    admin: new Types.ObjectId(groupData.admin),
    members: groupData.members.map((id) => new Types.ObjectId(id)),
  });

  const socketIds = newGroup.members.flatMap((member) => getSocketId(member.toString())).filter(Boolean);

  /** Notify to all members after group created */
  io.to(socketIds).emit("group:created", {
    ...newGroup.toJSON(),
    interaction: new Date().toISOString(),
  });

  await Conversation.create({
    participants: [newGroup._id],
    models: "Group",
  });

  return new ApiResponse(200, "Group created successfully!");
});

export const updateDetails = asyncHandler<{ id: string }, {}, UpdateDetails>(async (req) => {
  const groupId = req.params.id;
  const updateData = req.body;
  const reqUser = req.user?._id!;

  if (updateData.name) {
    const existingGroup = await Group.exists({
      name: updateData.name,
      admin: reqUser,
      _id: { $ne: groupId },
    });

    if (existingGroup) {
      throw new ApiError(400, "You already have another group with this name!");
    }
  }

  const updatedGroup = await Group.findOneAndUpdate(
    { _id: groupId, admin: reqUser },
    { $set: updateData },
    { returnDocument: "after" }
  );

  if (!updatedGroup) {
    throw new ApiError(404, "Group not found or you are not authorized!");
  }

  return new ApiResponse(200, "Group details updated successfully!", { data: updatedGroup });
});

export const updateMembers = asyncHandler<{ id: string }, {}, UpdateMembers>(async (req) => {
  const groupId = req.params.id;
  const { add, remove } = req.body;
  const reqUser = req.user?._id!;

  if (!add?.length && !remove?.length) {
    throw new ApiError(400, "Provide at least one member to add or remove!");
  }

  if (remove.includes(reqUser?.toString()!)) {
    throw new ApiError(400, "Admin cannot be removed from the group!");
  }

  const updateMembers = [...add, ...remove];

  if (updateMembers.length > 0) {
    const existingUsers = await User.find({
      _id: { $in: updateMembers },
    }).select("_id");

    const validUserIds = existingUsers.map((cur) => cur._id.toString());
    const invalidIds = updateMembers.filter((cur) => !validUserIds.includes(cur));

    if (invalidIds.length > 0) {
      throw new ApiError(400, `Invalid user IDs: ${invalidIds.join(", ")}`);
    }
  }

  const updateOps: any = {};

  if (add.length) updateOps.$addToSet = { members: { $each: add } };
  if (remove.length) updateOps.$pull = { members: { $in: remove } };

  const updatedGroup = await Group.findOneAndUpdate({ _id: groupId, admin: reqUser }, updateOps, {
    returnDocument: "after",
  });

  if (!updatedGroup) {
    throw new ApiError(404, "Group not found or you are not authorized!");
  }

  return new ApiResponse(200, "Group members updated successfully!", { data: updatedGroup });
});

export const updateAvatar = asyncHandler<{ id: string }>(async (req) => {
  const groupId = req.params.id;
  const imagePath = req.file?.path;
  const requestUser = req.user?._id!;

  if (!imagePath) {
    throw new ApiError(400, "Group avatar file required!");
  }

  const currentGroup = await Group.findOne({ _id: groupId, admin: requestUser });

  if (!currentGroup) {
    throw new ApiError(403, "You are not allowed make update to this group!");
  }

  const uploadImage = await uploadToCloudinary(imagePath);

  if (!uploadImage?.secure_url) {
    throw new ApiError(500, "Error while uploading group avatar!");
  }

  if (currentGroup?.avatar) {
    await deleteFromCloudinary(currentGroup.avatar);
  }

  currentGroup.avatar = uploadImage.secure_url;
  await currentGroup.save({ validateBeforeSave: false });

  return new ApiResponse(200, "Group avatar updated successfully!", { data: currentGroup });
});

export const deleteAvatar = asyncHandler<{ id: string }>(async (req) => {
  const groupId = req.params.id;
  const requestUser = req.user?._id!;

  const currentGroup = await Group.findOne({ _id: groupId, admin: requestUser });

  if (!currentGroup) {
    throw new ApiError(403, "You are not allowed update this group!");
  }

  if (!currentGroup.avatar) {
    throw new ApiError(400, "Group avatar is not available!");
  }

  await deleteFromCloudinary(currentGroup.avatar);

  currentGroup.avatar = null;
  await currentGroup.save({ validateBeforeSave: false });

  return new ApiResponse(200, "Group avatar deleted successfully!", { data: currentGroup });
});

export const fetchGroups = asyncHandler(async (req) => {
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

  return new ApiResponse(200, "Groups fetched successfully!", { data: groups });
});

export const fetchMembers = async (gid: Types.ObjectId) => {
  const group = await Group.findById(gid).select("-_id members").lean();
  return group?.members.map((id) => id.toString()) || [];
};
