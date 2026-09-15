import type { Request } from "express";
import { hash, compare } from "bcryptjs";
import { Types } from "mongoose";
import { User } from "#/models/index.js";
import { getSockets, emitEvent } from "#/server.js";
import { eventsService } from "#/services/events.js";
import { deleteFromCloudinary, uploadToCloudinary } from "#/utilities/cloudinary.js";
import { hasEmptyField, toUserInfo, type UserInfo } from "#/utilities/helpers.js";
import { asyncHandler, HttpError, HttpResponse } from "#/utilities/response.js";
import type { Profile, Password } from "#/utilities/schema.js";

export const requireUserId = (req: Request) => {
  if (!req.user || !Types.ObjectId.isValid(req.user)) {
    throw new HttpError(401, "Unauthorized request!");
  }
  return new Types.ObjectId(req.user);
};

const requireCurrentUser = async (req: Request, select?: string) => {
  const query = User.findById(requireUserId(req));

  if (select) {
    query.select(select);
  }

  const current = await query;

  if (!current) {
    throw new HttpError(404, "User not found!");
  }

  return current;
};

const profileUpdateEvents = async (userInfo: UserInfo) => {
  const sockets = getSockets(userInfo.id);
  emitEvent(sockets, "profile:update", userInfo);
};

export const profileUpdate = asyncHandler<{}, {}, Profile>(async (req, res) => {
  const { name, username, gender, bio } = req.body;
  const requestUser = await requireCurrentUser(req);

  if (username !== requestUser?.username) {
    const existsUsername = await User.exists({ username });

    if (existsUsername) {
      throw new HttpError(409, "Username already exists!");
    }
  }

  const wasSetup = requestUser.setup;

  requestUser.name = name;
  requestUser.username = username;
  requestUser.gender = gender;
  requestUser.bio = bio;
  requestUser.setup = !hasEmptyField({ name, username, gender });

  await requestUser.save();

  const userInfo = toUserInfo(requestUser);

  if (!wasSetup && userInfo.setup) {
    eventsService.send(userInfo.id, "profile-setup-complete", userInfo);
  }

  if (!userInfo.setup) {
    return HttpResponse.success(res, 200, "Complete your profile!");
  }

  await profileUpdateEvents(userInfo);

  return HttpResponse.success(res, 200, "Profile updated successfully!");
});

export const updateImage = asyncHandler(async (req, res) => {
  const imagePath = req.file?.path;

  if (!imagePath) {
    throw new HttpError(400, "Profile image file required!");
  }

  const requestUser = await requireCurrentUser(req);
  const uploadImage = await uploadToCloudinary(imagePath);

  if (!uploadImage?.secure_url) {
    throw new HttpError(500, "Error while uploading profile image!");
  }

  if (requestUser.image) {
    await deleteFromCloudinary(requestUser.image);
  }

  requestUser.image = uploadImage.secure_url;
  await requestUser.save();

  await profileUpdateEvents(toUserInfo(requestUser));

  return HttpResponse.success(res, 200, "Profile image updated successfully!");
});

export const deleteImage = asyncHandler(async (req, res) => {
  const requestUser = await requireCurrentUser(req);

  if (!requestUser.image) {
    throw new HttpError(400, "Profile image not available!");
  }

  await deleteFromCloudinary(requestUser.image);

  requestUser.image = null;
  await requestUser.save();

  await profileUpdateEvents(toUserInfo(requestUser));

  return HttpResponse.success(res, 200, "Profile image deleted successfully!");
});

export const changePassword = asyncHandler<{}, {}, Password>(async (req, res) => {
  const { old_password, new_password } = req.body;

  if (old_password === new_password) {
    throw new HttpError(400, "New password must be different!");
  }

  const requestUser = await requireCurrentUser(req, "+password");

  if (!(await compare(old_password, requestUser.password!))) {
    throw new HttpError(403, "Incorrect old password!");
  }

  requestUser.password = await hash(new_password, 12);
  await requestUser.save();

  await profileUpdateEvents(toUserInfo(requestUser));

  return HttpResponse.success(res, 200, "Password changed successfully!");
});

export const userInformation = asyncHandler(async (req, res) => {
  const userInfo = toUserInfo(await requireCurrentUser(req));
  return HttpResponse.success(res, 200, "User profile information!", userInfo);
});
