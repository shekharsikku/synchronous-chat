import { Types } from "mongoose";
import { requireUserId } from "#/controllers/user.js";
import { Group, User, Conversation } from "#/models/index.js";
import { getSockets, emitEvent } from "#/server.js";
import { toGroupInfo } from "#/utilities/helpers.js";
import { deleteFromCloudinary, uploadToCloudinary } from "#/utilities/cloudinary.js";
import { HttpError, HttpResponse, asyncHandler } from "#/utilities/response.js";
import type { CreateGroup, UpdateDetails, UpdateMembers } from "#/utilities/schema.js";

export const createGroup = asyncHandler<{}, {}, CreateGroup>(async (req, res) => {
  const groupData = req.body;
  const userId = requireUserId(req);

  if (groupData.admin !== userId?.toString()) {
    throw new HttpError(403, "Invalid group admin assignment!");
  }

  if (!groupData.members.includes(userId.toString())) {
    groupData.members.push(userId.toString());
  }

  groupData.members = [...new Set(groupData.members)];

  const [existingGroup, existingUsers] = await Promise.all([
    Group.exists({ name: groupData.name, admin: userId }),
    User.find({ _id: { $in: groupData.members } }).select("_id"),
  ]);

  if (existingGroup) {
    throw new HttpError(409, "Group name already exists!");
  }

  if (existingUsers.length !== groupData.members.length) {
    throw new HttpError(400, "Some members don't exists!");
  }

  const newGroup = await Group.create({
    name: groupData.name,
    description: groupData.description,
    admin: new Types.ObjectId(groupData.admin),
    members: groupData.members.map((id) => new Types.ObjectId(id)),
  });

  const groupInfo = toGroupInfo(newGroup);
  const sockets = groupData.members.flatMap(getSockets).filter(Boolean);

  /** Notify to all members after group created */
  emitEvent(sockets, "group:created", groupInfo);

  await Conversation.create({
    participants: [newGroup._id],
    models: "Group",
  });

  return HttpResponse.success(res, 201, "Group created successfully!", groupInfo);
});

export const updateDetails = asyncHandler<{ id: string }, {}, UpdateDetails>(async (req, res) => {
  const groupId = req.params.id;
  const updateData = req.body;
  const userId = requireUserId(req);

  if (updateData.name) {
    const existingGroup = await Group.exists({
      name: updateData.name,
      admin: userId,
      _id: { $ne: groupId },
    });

    if (existingGroup) {
      throw new HttpError(409, "Group name already exists!");
    }
  }

  const updatedGroup = await Group.findOneAndUpdate(
    { _id: groupId, admin: userId },
    { $set: updateData },
    { returnDocument: "after" }
  );

  if (!updatedGroup) {
    throw new HttpError(404, "Group not found!");
  }

  return HttpResponse.success(res, 200, "Group details updated successfully!", toGroupInfo(updatedGroup));
});

const toObjectIds = (ids: string[]) =>
  ids.map((id) => {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpError(400, `Invalid ObjectId: ${id}`);
    }
    return new Types.ObjectId(id);
  });

export const updateMembers = asyncHandler<{ id: string }, {}, UpdateMembers>(async (req, res) => {
  const groupId = req.params.id;
  const { add, remove } = req.body;
  const userId = requireUserId(req);

  if (!add?.length && !remove?.length) {
    throw new HttpError(400, "Provide at least one member!");
  }

  if (remove.includes(userId?.toString()!)) {
    throw new HttpError(403, "Admin cannot be removed!");
  }

  const addIds = toObjectIds(add);
  const removeIds = toObjectIds(remove);
  const memberIds = [...add, ...remove];

  const existingUsers = new Set((await User.distinct("_id", { _id: { $in: memberIds } })).map(String));
  const missingUsers = memberIds.filter((id) => !existingUsers.has(id));

  if (missingUsers.length > 0) {
    throw new HttpError(400, `Users not found: ${missingUsers.join(", ")}`);
  }

  const updatedGroup = await Group.findOneAndUpdate(
    { _id: groupId, admin: userId },
    [
      {
        $set: {
          members: {
            $setUnion: [
              {
                $setDifference: ["$members", removeIds],
              },
              addIds,
            ],
          },
        },
      },
    ],
    { returnDocument: "after", updatePipeline: true }
  );

  if (!updatedGroup) {
    throw new HttpError(404, "Group not found!");
  }

  return HttpResponse.success(res, 200, "Group members updated successfully!", toGroupInfo(updatedGroup));
});

export const updateAvatar = asyncHandler<{ id: string }>(async (req, res) => {
  const groupId = req.params.id;
  const imagePath = req.file?.path;
  const userId = requireUserId(req);

  if (!imagePath) {
    throw new HttpError(400, "Group avatar file required!");
  }

  const currentGroup = await Group.findOne({ _id: groupId, admin: userId });

  if (!currentGroup) {
    throw new HttpError(404, "Group not found!");
  }

  const uploadImage = await uploadToCloudinary(imagePath);

  if (!uploadImage?.secure_url) {
    throw new HttpError(500, "Error while uploading avatar!");
  }

  if (currentGroup?.avatar) {
    await deleteFromCloudinary(currentGroup.avatar);
  }

  currentGroup.avatar = uploadImage.secure_url;
  await currentGroup.save();

  return HttpResponse.success(res, 200, "Group avatar updated successfully!", toGroupInfo(currentGroup));
});

export const deleteAvatar = asyncHandler<{ id: string }>(async (req, res) => {
  const groupId = req.params.id;
  const userId = requireUserId(req);

  const currentGroup = await Group.findOne({ _id: groupId, admin: userId });

  if (!currentGroup) {
    throw new HttpError(404, "Group not found!");
  }

  if (!currentGroup.avatar) {
    throw new HttpError(400, "Group avatar not available!");
  }

  await deleteFromCloudinary(currentGroup.avatar);

  currentGroup.avatar = null;
  await currentGroup.save();

  return HttpResponse.success(res, 200, "Group avatar deleted successfully!", toGroupInfo(currentGroup));
});

export const fetchGroups = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);

  const groups = await Group.aggregate([
    { $match: { members: userId } },
    {
      $lookup: {
        from: "conversations",
        let: { groupId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $in: ["$$groupId", "$participants"],
              },
            },
          },
          {
            $project: {
              _id: 0,
              interaction: 1,
            },
          },
        ],
        as: "conversation",
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        avatar: 1,
        admin: 1,
        members: 1,
        interaction: {
          $arrayElemAt: ["$conversation.interaction", 0],
        },
      },
    },
  ]);

  return HttpResponse.success(res, 200, "Groups fetched successfully!", groups.map(toGroupInfo));
});

export const fetchMembers = async (groupId: string) => {
  const members = await Group.distinct("members", { _id: groupId });
  return members.map((id) => id.toString());
};
