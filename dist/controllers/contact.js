"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchContact = exports.fetchContacts = exports.availableContact = exports.searchContact = void 0;
const utils_1 = require("../utils");
const mongoose_1 = require("mongoose");
const user_1 = __importDefault(require("../models/user"));
const conversation_1 = __importDefault(require("../models/conversation"));
const searchContact = async (req, res) => {
    try {
        const search = req.query.search;
        if (!search) {
            throw new utils_1.ApiError(400, "Search terms is required!");
        }
        const terms = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(terms, "i");
        const contacts = await user_1.default.find({
            $and: [
                { _id: { $ne: req.user?._id } },
                { setup: true },
                { $or: [{ name: regex }, { username: regex }, { email: regex }] },
            ],
        }).lean();
        if (contacts.length == 0) {
            throw new utils_1.ApiError(404, "No any contact found!");
        }
        return (0, utils_1.ApiResponse)(res, 200, "Available contacts!", contacts);
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, error.code, error.message);
    }
};
exports.searchContact = searchContact;
const availableContact = async (req, res) => {
    try {
        const users = await user_1.default.find({
            _id: { $ne: req.user?._id },
            setup: true,
        }).lean();
        if (users.length == 0) {
            throw new utils_1.ApiError(404, "No any contact available!");
        }
        const contacts = users.map((user) => ({
            label: `${user.name} (${user.username})`,
            value: user._id,
        }));
        return (0, utils_1.ApiResponse)(res, 200, "Contacts fetched successfully!", contacts);
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, error.code, error.message);
    }
};
exports.availableContact = availableContact;
const fetchContacts = async (req, res) => {
    try {
        const uid = new mongoose_1.Types.ObjectId(req.user?._id);
        const conversations = await conversation_1.default.find({
            participants: uid,
        })
            .sort({ interaction: -1 })
            .populate("participants", "name email username gender image bio")
            .lean();
        const contacts = conversations
            .map((conversation) => {
            const contact = conversation.participants.find((participant) => !participant._id.equals(uid));
            return contact
                ? { ...contact, interaction: conversation.interaction }
                : null;
        })
            .filter(Boolean);
        return (0, utils_1.ApiResponse)(res, 200, "Contacts fetched successfully!", contacts);
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, 500, "An error occurred while fetching contacts!");
    }
};
exports.fetchContacts = fetchContacts;
const fetchContact = async (req, res) => {
    try {
        const userId = req.params.id;
        const userContact = await user_1.default.findById(userId).select("-setup -createdAt -updatedAt -__v");
        if (!userContact) {
            throw new utils_1.ApiError(404, "Contact not found!");
        }
        return (0, utils_1.ApiResponse)(res, 200, "Contact fetched successfully!", userContact);
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, 500, "An error occurred while fetching contact!");
    }
};
exports.fetchContact = fetchContact;
