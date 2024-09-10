import { Request, Response } from "express";
import { Types } from "mongoose";
import { ApiResponse, ApiError } from "../utils";
import User from "../models/user";
import Message from "../models/message";

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
    return ApiResponse(req, res, 200, "All searched contacts!", contacts);
  } catch (error: any) {
    return ApiResponse(req, res, error.code, error.message);
  }
};

const getAllContacts = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const users = await User.find({ _id: { $ne: userId } });

    if (!users || users.length == 0) {
      throw new ApiError(404, "No any contact available!");
    }

    const contacts = users.map((user) => ({
      label: user.username ? `${user.fullName} (${user.username})` : user.email,
      value: user._id,
    }));

    return ApiResponse(
      req,
      res,
      200,
      "Contacts fetched successfully!",
      contacts
    );
  } catch (error: any) {
    return ApiResponse(req, res, error.code, error.message);
  }
};

const getContactsList = async (req: Request, res: Response) => {
  try {
    let userId = req.user?._id;
    userId = new Types.ObjectId(userId);

    const contacts = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { recipient: userId }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ["$sender", userId] },
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
          email: "$contactInfo.email",
          fullName: "$contactInfo.fullName",
          username: "$contactInfo.username",
          imageUrl: "$contactInfo.imageUrl",
          profileColor: "$contactInfo.profileColor",
        },
      },
      {
        $sort: { lastMessageTime: -1 },
      },
    ]);
    return ApiResponse(
      req,
      res,
      200,
      "Contacts fetched successfully!",
      contacts
    );
  } catch (error: any) {
    return ApiResponse(req, res, error.code || 500, error.message);
  }
};

export { searchContact, getAllContacts, getContactsList };
