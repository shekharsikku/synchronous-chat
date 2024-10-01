import { ApiResponse, ApiError } from "../utils";
import { Request, Response } from "express";
import { Types } from "mongoose";
import Message from "../models/message";
import User from "../models/user";

const searchContact = async (req: Request, res: Response) => {
  try {
    const { searchTerm: search }: { searchTerm: string } = await req.body;

    if (search === undefined || search === null) {
      throw new ApiError(400, "Search terms is required!");
    }

    const terms = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const regex = new RegExp(terms, "i");

    const contacts = await User.find({
      $and: [
        { _id: { $ne: req.user?._id } },
        { $or: [{ fullName: regex }, { username: regex }, { email: regex }] },
      ],
    });

    if (contacts.length <= 0) {
      throw new ApiError(404, "No any contact available!");
    }
    return ApiResponse(res, 200, "All searched contacts!", contacts);
  } catch (error: any) {
    return ApiResponse(res, error.code, error.message);
  }
};

const getAllContacts = async (req: Request, res: Response) => {
  try {
    const users = await User.find({ _id: { $ne: req.user?._id } });

    if (!users || users.length == 0) {
      throw new ApiError(404, "No any contact available!");
    }

    const contacts = users.map((user) => ({
      label: user.username ? `${user.name} (${user.username})` : user.email,
      value: user._id,
    }));

    return ApiResponse(res, 200, "Contacts fetched successfully!", contacts);
  } catch (error: any) {
    return ApiResponse(res, error.code, error.message);
  }
};

const getContactsList = async (req: Request, res: Response) => {
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
    return ApiResponse(res, error.code || 500, error.message);
  }
};

export { searchContact, getAllContacts, getContactsList };
