import { genSalt, hash, compare } from "bcryptjs";
import { User } from "#/models/index.js";
import { getSockets, emitEvent } from "#/server.js";
import { eventsService } from "#/services/events.js";
import { deleteFromCloudinary, uploadToCloudinary } from "#/utilities/cloudinary.js";
import { hasEmptyField, createUserInfo, generateAccess, type UserInfo } from "#/utilities/helpers.js";
import { asyncHandler, HttpError, HttpResponse } from "#/utilities/response.js";
import type { Profile, Password } from "#/utilities/schema.js";
import { revokeToken } from "./auth.js";

const profileUpdateEvents = async (userData: UserInfo) => {
  const sockets = getSockets(userData._id.toString());
  emitEvent(sockets, "profile:update", userData);
};

export const profileSetup = asyncHandler<{}, {}, Profile>(async (req, res) => {
  const { name, username, gender, bio } = req.body;
  const requestUser = req.user!;

  if (username !== requestUser?.username) {
    const existsUsername = await User.exists({ username });

    if (existsUsername) {
      throw new HttpError(409, "Username already exists!");
    }
  }

  const wasSetup = requestUser?.setup;
  const userDetails = { name, username, gender, bio, setup: false };

  if (!hasEmptyField({ name, username, gender })) {
    userDetails.setup = true;
  }

  const updatedProfile = await User.findByIdAndUpdate(requestUser?._id, userDetails, {
    returnDocument: "after",
  });

  if (!updatedProfile) {
    const currentAuthKey = req.cookies["current"];

    if (currentAuthKey) {
      await revokeToken(res, currentAuthKey);
    }

    throw new HttpError(401, "Please, sign in again!");
  }

  const userInfo = createUserInfo(updatedProfile);

  if (!wasSetup && userInfo.setup) {
    eventsService.send(requestUser._id.toString(), "profile-setup-complete", userInfo);
  }

  if (!userInfo.setup) {
    return new HttpResponse(200, "Please, complete your profile!");
  }

  await generateAccess(res, userInfo);
  await profileUpdateEvents(userInfo);

  return new HttpResponse(200, "Profile updated successfully!", { data: userInfo });
});

export const updateImage = asyncHandler(async (req, res) => {
  const imagePath = req.file?.path;

  if (!imagePath) {
    throw new HttpError(400, "Profile image file required!");
  }

  const requestUser = await User.findById(req.user?._id!);

  if (!requestUser) {
    const currentAuthKey = req.cookies["current"];

    if (currentAuthKey) {
      await revokeToken(res, currentAuthKey);
    }

    throw new HttpError(401, "Please, sign in again!");
  }

  const uploadImage = await uploadToCloudinary(imagePath);

  if (!uploadImage?.secure_url) {
    throw new HttpError(500, "Error while uploading profile image!");
  }

  if (requestUser?.image) {
    deleteFromCloudinary(requestUser.image).catch(() => {});
  }

  requestUser.image = uploadImage.secure_url;
  await requestUser.save({ validateBeforeSave: false });

  const userInfo = createUserInfo(requestUser);

  await generateAccess(res, userInfo);
  await profileUpdateEvents(userInfo);

  return new HttpResponse(200, "Profile image updated successfully!", { data: userInfo });
});

export const deleteImage = asyncHandler(async (req, res) => {
  const requestUser = await User.findById(req.user?._id!);

  if (!requestUser) {
    const currentAuthKey = req.cookies["current"];

    if (currentAuthKey) {
      await revokeToken(res, currentAuthKey);
    }

    throw new HttpError(401, "Please, sign in again!");
  }

  if (!requestUser.image) {
    throw new HttpError(400, "Profile image not available!");
  }

  deleteFromCloudinary(requestUser.image).catch(() => {});

  requestUser.image = null;
  await requestUser.save({ validateBeforeSave: false });

  const userInfo = createUserInfo(requestUser);

  await generateAccess(res, userInfo);
  await profileUpdateEvents(userInfo);

  return new HttpResponse(200, "Profile image deleted successfully!", { data: userInfo });
});

export const changePassword = asyncHandler<{}, {}, Password>(async (req, res) => {
  const { old_password, new_password } = req.body;

  if (old_password === new_password) {
    throw new HttpError(400, "New password must be different!");
  }

  const requestUser = await User.findById(req.user?._id!).select("+password");

  if (!requestUser) {
    const currentAuthKey = req.cookies["current"];

    if (currentAuthKey) {
      await revokeToken(res, currentAuthKey);
    }

    throw new HttpError(401, "Please, sign in again!");
  }

  if (!(await compare(old_password, requestUser.password!))) {
    throw new HttpError(403, "Incorrect old password!");
  }

  const hashSalt = await genSalt(12);
  requestUser.password = await hash(new_password, hashSalt);
  await requestUser.save({ validateBeforeSave: true });

  const userInfo = createUserInfo(requestUser);
  await generateAccess(res, userInfo);

  return new HttpResponse(200, "Password changed successfully!", { data: userInfo });
});

export const userInformation = asyncHandler(async (req) => {
  return new HttpResponse(200, "User profile information!", { data: req.user! });
});
