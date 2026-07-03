import { Types } from "mongoose";
import { User, Conversation } from "#/models/index.js";
import { HttpError, HttpResponse, asyncHandler } from "#/utilities/response.js";

export const searchContact = asyncHandler<{}, {}, {}, { search?: string }>(async (req) => {
  const search = req.query.search;

  if (!search) {
    throw new HttpError(400, "Search terms is required!");
  }

  const terms = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(terms, "i");

  const contacts = await User.find({
    $and: [
      { _id: { $ne: req.user?._id! } },
      { setup: true },
      { $or: [{ name: regex }, { username: regex }, { email: regex }] },
    ],
  })
    .select("-setup -createdAt -updatedAt -__v")
    .lean();

  if (contacts.length == 0) {
    throw new HttpError(404, "No any contact found!");
  }

  return new HttpResponse(200, "Available contacts!", { data: contacts });
});

export const availableContact = asyncHandler(async (req) => {
  const contacts = await User.find({
    _id: { $ne: req.user?._id! },
    setup: true,
  })
    .select("-setup -createdAt -updatedAt -__v")
    .lean();

  if (contacts.length == 0) {
    throw new HttpError(404, "No any contact available!");
  }

  return new HttpResponse(200, "Contacts fetched successfully!", { data: contacts });
});

export const fetchContacts = asyncHandler(async (req) => {
  const uid = new Types.ObjectId(req.user?._id);

  const contacts = await Conversation.aggregate([
    { $match: { participants: uid } },
    { $sort: { interaction: -1 } },
    {
      $lookup: {
        from: "users",
        let: { participantIds: "$participants" },
        pipeline: [
          { $match: { $expr: { $in: ["$_id", "$$participantIds"] } } },
          { $project: { _id: 1, name: 1, email: 1, username: 1, gender: 1, image: 1, bio: 1 } },
        ],
        as: "participantsData",
      },
    },
    {
      $addFields: {
        contact: {
          $filter: {
            input: "$participantsData",
            as: "p",
            cond: { $ne: ["$$p._id", uid] },
          },
        },
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [{ $arrayElemAt: ["$contact", 0] }, { interaction: "$interaction" }],
        },
      },
    },
    { $match: { _id: { $ne: null } } },
  ]);

  return new HttpResponse(200, "Contacts fetched successfully!", { data: contacts });
});

export const fetchContact = asyncHandler<{ id: string }>(async (req) => {
  const userId = req.params.id;

  const userContact = await User.findById(userId).select("-setup -createdAt -updatedAt -__v");

  if (!userContact) {
    throw new HttpError(404, "Contact not found!");
  }

  return new HttpResponse(200, "Contact fetched successfully!", { data: userContact });
});
