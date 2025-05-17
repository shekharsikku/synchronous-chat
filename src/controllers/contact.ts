import type { Request, Response } from "express";
import { HttpError, SuccessResponse, ErrorResponse } from "../utils/index.js";
import { Types } from "mongoose";
import { User, Conversation } from "../models/index.js";

const searchContact = async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string;

    if (!search) {
      throw new HttpError(400, "Search terms is required!");
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
      throw new HttpError(404, "No any contact found!");
    }

    return SuccessResponse(res, 200, "Available contacts!", contacts);
  } catch (error: any) {
    return ErrorResponse(
      res,
      error.code || 500,
      error.message || "Error while searching contacts!"
    );
  }
};

const availableContact = async (req: Request, res: Response) => {
  try {
    const users = await User.find({
      _id: { $ne: req.user?._id },
      setup: true,
    }).lean();

    if (users.length == 0) {
      throw new HttpError(404, "No any contact available!");
    }

    const contacts = users.map((user) => ({
      label: `${user.name} (${user.username})`,
      value: user._id,
    }));

    return SuccessResponse(
      res,
      200,
      "Contacts fetched successfully!",
      contacts
    );
  } catch (error: any) {
    return ErrorResponse(
      res,
      error.code || 500,
      error.message || "Error while fetching contacts!"
    );
  }
};

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

    return SuccessResponse(
      res,
      200,
      "Contacts fetched successfully!",
      contacts
    );
  } catch (error: any) {
    return ErrorResponse(
      res,
      error.code || 500,
      error.message || "Error while fetching contacts!"
    );
  }
};

const fetchContact = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;

    const userContact = await User.findById(userId).select(
      "-setup -createdAt -updatedAt -__v"
    );

    if (!userContact) {
      throw new HttpError(404, "Contact not found!");
    }

    return SuccessResponse(
      res,
      200,
      "Contact fetched successfully!",
      userContact
    );
  } catch (error: any) {
    return ErrorResponse(
      res,
      error.code || 500,
      error.message || "Error while fetching contact!"
    );
  }
};

export { searchContact, availableContact, fetchContacts, fetchContact };
