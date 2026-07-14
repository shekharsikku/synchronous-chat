import { Types } from "mongoose";
import { User, Conversation } from "#/models/index.js";
import { HttpError, HttpResponse, asyncHandler } from "#/utilities/response.js";

export const searchContact = asyncHandler<{}, {}, {}, { search?: string }>(async (req) => {
  const search = req.query.search;
  const userId = req.user?._id!;

  if (!search) {
    throw new HttpError(400, "Search terms is required!");
  }

  const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

  const contacts = await User.find({
    _id: { $ne: userId },
    setup: true,
    $or: [{ name: regex }, { username: regex }, { email: regex }],
  })
    .select("-setup -createdAt -updatedAt -__v")
    .lean();

  return new HttpResponse(200, "Contacts searched successfully!", { data: contacts });
});

export const availableContact = asyncHandler(async (req) => {
  const userId = req.user?._id!;

  const contacts = await User.find({
    _id: { $ne: userId },
    setup: true,
  })
    .select("-setup -createdAt -updatedAt -__v")
    .lean();

  return new HttpResponse(200, "Contacts fetched successfully!", { data: contacts });
});

export const fetchContacts = asyncHandler(async (req) => {
  const userId = new Types.ObjectId(req.user?._id);

  const contacts = await Conversation.aggregate([
    { $match: { participants: userId } },
    { $sort: { interaction: -1 } },
    {
      $project: {
        _id: 0,
        participants: 1,
        interaction: 1,
      },
    },
    {
      $lookup: {
        from: "users",
        let: { participants: "$participants" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $in: ["$_id", "$$participants"] }, { $ne: ["$_id", userId] }],
              },
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
              email: 1,
              username: 1,
              gender: 1,
              image: 1,
              bio: 1,
            },
          },
        ],
        as: "contacts",
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [{ $arrayElemAt: ["$contacts", 0] }, { interaction: "$interaction" }],
        },
      },
    },
    { $match: { _id: { $ne: null } } },
  ]);

  return new HttpResponse(200, "Contacts fetched successfully!", { data: contacts });
});

export const fetchContact = asyncHandler<{ id: string }>(async (req) => {
  const userId = req.params.id;

  const contact = await User.findById(userId).select("-setup -createdAt -updatedAt -__v");

  if (!contact) {
    throw new HttpError(404, "Contact not found!");
  }

  return new HttpResponse(200, "Contact fetched successfully!", { data: contact });
});
