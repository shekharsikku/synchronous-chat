"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchContacts = exports.availableContact = exports.searchContact = void 0;
const utils_1 = require("../utils");
const mongoose_1 = require("mongoose");
const user_1 = __importDefault(require("../models/user"));
const conversation_1 = __importDefault(require("../models/conversation"));
const searchContact = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { searchTerm: search } = yield req.body;
        if (search === undefined || search === null) {
            throw new utils_1.ApiError(400, "Search terms is required!");
        }
        const terms = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(terms, "i");
        const contacts = yield user_1.default.find({
            $and: [
                { _id: { $ne: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id } },
                { setup: true },
                { $or: [{ fullName: regex }, { username: regex }, { email: regex }] },
            ],
        });
        if (contacts.length <= 0) {
            throw new utils_1.ApiError(404, "No contact found!");
        }
        return (0, utils_1.ApiResponse)(res, 200, "Available contacts!", contacts);
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, error.code, error.message);
    }
});
exports.searchContact = searchContact;
const availableContact = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const users = yield user_1.default.find({ _id: { $ne: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id }, setup: true });
        if (users.length == 0) {
            throw new utils_1.ApiError(404, "No any contact available!");
        }
        const contacts = users.map((user) => ({
            label: user.username ? `${user.name} (${user.username})` : user.email,
            value: user._id,
        }));
        return (0, utils_1.ApiResponse)(res, 200, "Contacts fetched successfully!", contacts);
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, error.code, error.message);
    }
});
exports.availableContact = availableContact;
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
    return ApiResponse(res, error.code || 500, error.message);
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
    return ApiResponse(
      res,
      error.code || 500,
      error.message || "An error occurred while fetching contacts."
    );
  }
};
*/
const fetchContacts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const uid = new mongoose_1.Types.ObjectId((_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
        const conversations = yield conversation_1.default.find({
            participants: uid,
        })
            .sort({ interaction: -1 })
            .populate("participants", "name email username gender image bio")
            .lean();
        const contacts = conversations.map((conversation) => {
            const contact = conversation.participants.find((participant) => participant._id.toString() !== uid.toString());
            if (contact) {
                return Object.assign(Object.assign({}, contact), { interaction: conversation.interaction });
            }
        });
        return (0, utils_1.ApiResponse)(res, 200, "Contacts fetched successfully!", contacts);
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, error.code || 500, error.message || "An error occurred while fetching contacts.");
    }
});
exports.fetchContacts = fetchContacts;
