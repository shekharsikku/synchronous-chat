import { genSalt, hash, compare } from "bcryptjs";

import { User } from "#/models/index.js";
import { getSocketId, io } from "#/server.js";
import { eventsService } from "#/services/events.js";
import { deleteImageByUrl, uploadOnCloudinary } from "#/utils/cloudinary.js";
import { hasEmptyField, createUserInfo, generateAccess } from "#/utils/helpers.js";
import { HttpError, HttpHandler } from "#/utils/response.js";

import type { UserInterface } from "#/interfaces/index.js";
import type { Profile, Password } from "#/utils/schema.js";

const profileUpdateEvents = async (userData: UserInterface) => {
  const userSocketIds = getSocketId(userData._id.toString());
  io.to(userSocketIds).emit("profile:update", userData);
};

export const profileSetup = HttpHandler.wrap<{}, {}, Profile>(async (req, res) => {
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
  const isCompleted = !hasEmptyField({ name, username, gender });

  if (isCompleted) {
    userDetails.setup = true;
  }

  const updatedProfile = await User.findByIdAndUpdate(requestUser?._id, userDetails, {
    new: true,
  });

  if (!updatedProfile) {
    throw new HttpError(400, "Profile setup not completed!");
  }

  const userInfo = createUserInfo(updatedProfile);

  if (!wasSetup && userInfo.setup) {
    eventsService.send(requestUser._id.toString(), "profile-setup-complete", userInfo);
  }

  if (!userInfo.setup) {
    return HttpHandler.success(res, 200, "Please, complete your profile!");
  }

  await generateAccess(res, userInfo);
  await profileUpdateEvents(userInfo);

  return HttpHandler.success(res, 200, "Profile updated successfully!");
});

export const updateImage = HttpHandler.wrap(async (req, res) => {
  const imagePath = req.file?.path;
  const requestUser = req.user?._id!;

  if (!imagePath) {
    throw new HttpError(400, "Profile image file required!");
  }

  const userProfile = await User.findById(requestUser);

  if (!userProfile) {
    throw new HttpError(404, "Can't get current user profile!");
  }

  const uploadImage = await uploadOnCloudinary(imagePath);

  if (!uploadImage?.secure_url) {
    throw new HttpError(500, "Error while uploading profile image!");
  }

  if (userProfile?.image) {
    await deleteImageByUrl(userProfile.image);
  }

  userProfile.image = uploadImage.secure_url;
  await userProfile.save({ validateBeforeSave: false });

  const userInfo = createUserInfo(userProfile);

  await generateAccess(res, userInfo);
  await profileUpdateEvents(userInfo);

  return HttpHandler.success(res, 200, "Profile image updated successfully!");
});

export const deleteImage = HttpHandler.wrap(async (req, res) => {
  const requestUser = req.user?._id!;

  const userProfile = await User.findById(requestUser);

  if (!userProfile) {
    throw new HttpError(404, "Can't get current user profile!");
  }

  if (!userProfile.image) {
    throw new HttpError(400, "Profile image not available!");
  }

  await deleteImageByUrl(userProfile.image);

  userProfile.image = null;
  await userProfile.save({ validateBeforeSave: false });

  const userInfo = createUserInfo(userProfile);

  await generateAccess(res, userInfo);
  await profileUpdateEvents(userInfo);

  return HttpHandler.success(res, 200, "Profile image deleted successfully!");
});

export const changePassword = HttpHandler.wrap<{}, {}, Password>(async (req, res) => {
  const { old_password, new_password } = req.body;

  if (old_password === new_password) {
    throw new HttpError(400, "Please, choose a different password!");
  }

  const requestUser = await User.findById(req.user?._id).select("+password");

  if (!requestUser) {
    throw new HttpError(401, "Invalid authorization!");
  }

  const isCorrect = await compare(old_password, requestUser.password!);

  if (!isCorrect) {
    throw new HttpError(401, "Incorrect old password!");
  }

  const hashSalt = await genSalt(12);
  requestUser.password = await hash(new_password, hashSalt);
  await requestUser.save({ validateBeforeSave: true });

  const userInfo = createUserInfo(requestUser);
  await generateAccess(res, userInfo);

  return HttpHandler.success(res, 200, "Password changed successfully!");
});

export const userInformation = HttpHandler.wrap(async (req, res) => {
  const message = req.user?.setup ? "User profile information!" : "Please, complete your profile!";
  return HttpHandler.success(res, 200, message, req.user);
});
