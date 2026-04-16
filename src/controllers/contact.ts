import { Types } from "mongoose";

import { User, Conversation } from "#/models/index.js";
import { HttpError, HttpHandler } from "#/utils/response.js";

export const searchContact = HttpHandler.wrap<{}, {}, {}, { search?: string }>(async (req, res) => {
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

  return HttpHandler.success(res, 200, "Available contacts!", contacts);
});

export const availableContact = HttpHandler.wrap(async (req, res) => {
  const contacts = await User.find({
    _id: { $ne: req.user?._id! },
    setup: true,
  })
    .select("-setup -createdAt -updatedAt -__v")
    .lean();

  if (contacts.length == 0) {
    throw new HttpError(404, "No any contact available!");
  }

  return HttpHandler.success(res, 200, "Contacts fetched successfully!", contacts);
});

export const fetchContacts = HttpHandler.wrap(async (req, res) => {
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

  return HttpHandler.success(res, 200, "Contacts fetched successfully!", contacts);
});

export const fetchContact = HttpHandler.wrap<{ id: string }>(async (req, res) => {
  const userId = req.params.id;

  const userContact = await User.findById(userId).select("-setup -createdAt -updatedAt -__v");

  if (!userContact) {
    throw new HttpError(404, "Contact not found!");
  }

  return HttpHandler.success(res, 200, "Contact fetched successfully!", userContact);
});
