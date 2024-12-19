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
        const search = req.query.search;
        if (!search) {
            throw new utils_1.ApiError(400, "Search terms is required!");
        }
        const terms = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(terms, "i");
        const contacts = yield user_1.default.find({
            $and: [
                { _id: { $ne: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id } },
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
});
exports.searchContact = searchContact;
const availableContact = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const users = yield user_1.default.find({
            _id: { $ne: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id },
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
});
exports.availableContact = availableContact;
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
        const contacts = conversations
            .map((conversation) => {
            const contact = conversation.participants.find((participant) => !participant._id.equals(uid));
            return contact
                ? Object.assign(Object.assign({}, contact), { interaction: conversation.interaction }) : null;
        })
            .filter(Boolean);
        return (0, utils_1.ApiResponse)(res, 200, "Contacts fetched successfully!", contacts);
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, 500, "An error occurred while fetching contacts!");
    }
});
exports.fetchContacts = fetchContacts;
