import { ApiResponse, ApiError } from "../utils";
import { Request, Response } from "express";
import { Types } from "mongoose";
import User from "../models/user";
import Conversation from "../models/conversation";

const searchContact = async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string;

    if (!search) {
      throw new ApiError(400, "Search terms is required!");
    }

    const terms = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(terms, "i");

    const contacts = await User.find({
      $and: [
        { _id: { $ne: req.user?._id } },
        { setup: true },
        { $or: [{ name: regex }, { username: regex }, { email: regex }] },
      ],
    }).lean();

    if (contacts.length == 0) {
      throw new ApiError(404, "No any contact found!");
    }

    return ApiResponse(res, 200, "Available contacts!", contacts);
  } catch (error: any) {
    return ApiResponse(res, error.code, error.message);
  }
};

const availableContact = async (req: Request, res: Response) => {
  try {
    const users = await User.find({
      _id: { $ne: req.user?._id },
      setup: true,
    }).lean();

    if (users.length == 0) {
      throw new ApiError(404, "No any contact available!");
    }

    const contacts = users.map((user) => ({
      label: `${user.name} (${user.username})`,
      value: user._id,
    }));

    return ApiResponse(res, 200, "Contacts fetched successfully!", contacts);
  } catch (error: any) {
    return ApiResponse(res, error.code, error.message);
  }
};

/*
const fetchContacts = async (req: Request, res: Response) => {
  try {
    let uid = req.user?._id;
    uid = new Types.ObjectId(uid);

    const contacts = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: uid }, { recipient: uid }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ["$sender", uid] },
              then: "$recipient",
              else: "$sender",
            },
          },
          lastMessageTime: { $first: "$createdAt" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "contactInfo",
        },
      },
      {
        $unwind: "$contactInfo",
      },
      {
        $project: {
          _id: 1,
          lastMessageTime: 1,
          name: "$contactInfo.name",
          email: "$contactInfo.email",
          username: "$contactInfo.username",
          gender: "$contactInfo.gender",
          image: "$contactInfo.image",
          bio: "$contactInfo.bio",
        },
      },
      {
        $sort: { lastMessageTime: -1 },
      },
    ]);
    return ApiResponse(res, 200, "Contacts fetched successfully!", contacts);
  } catch (error: any) {
    return ApiResponse(res, 500, "An error occurred while fetching contacts!");
  }
};

const fetchContacts = async (req: Request, res: Response) => {
  try {
    const uid = new Types.ObjectId(req.user?._id);
    
    const contacts = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: uid }, { recipient: uid }],
        },
      },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ["$sender", uid] },
              then: "$recipient",
              else: "$sender",
            },
          },
          lastMessageTime: { $max: "$createdAt" }, // Use `$max` to avoid sorting before grouping
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "contactInfo",
        },
      },
      {
        $unwind: "$contactInfo",
      },
      {
        $project: {
          _id: 1,
          lastMessageTime: 1,
          name: "$contactInfo.name",
          email: "$contactInfo.email",
          username: "$contactInfo.username",
          gender: "$contactInfo.gender",
          image: "$contactInfo.image",
          bio: "$contactInfo.bio",
        },
      },
      {
        $sort: { lastMessageTime: -1 }, // Final sorting by last message time
      },
    ]);
    
    return ApiResponse(res, 200, "Contacts fetched successfully!", contacts);
  } catch (error: any) {
    return ApiResponse(res, 500, "An error occurred while fetching contacts!");
  }
};
*/

const fetchContacts = async (req: Request, res: Response) => {
  try {
    const uid = new Types.ObjectId(req.user?._id);

    const conversations = await Conversation.find({
      participants: uid,
    })
      .sort({ interaction: -1 })
      .populate("participants", "name email username gender image bio")
      .lean();

    const contacts = conversations
      .map((conversation) => {
        const contact = conversation.participants.find(
          (participant: any) => !participant._id.equals(uid)
        );

        return contact
          ? { ...contact, interaction: conversation.interaction }
          : null;
      })
      .filter(Boolean);

    return ApiResponse(res, 200, "Contacts fetched successfully!", contacts);
  } catch (error: any) {
    return ApiResponse(res, 500, "An error occurred while fetching contacts!");
  }
};

const fetchContact = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;

    const userContact = await User.findById(userId).select(
      "-setup -createdAt -updatedAt -__v"
    );

    if (!userContact) {
      throw new ApiError(404, "Contact not found!");
    }

    return ApiResponse(res, 200, "Contact fetched successfully!", userContact);
  } catch (error: any) {
    return ApiResponse(res, 500, "An error occurred while fetching contact!");
  }
};

export { searchContact, availableContact, fetchContacts, fetchContact };
