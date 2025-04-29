import { Request, Response } from "express";
import { genSalt, hash, compare } from "bcryptjs";
import { ApiError, ApiResponse } from "../utils";
import { deleteImageByUrl, uploadOnCloudinary } from "../utils/cloudinary";
import {
  unlinkFilesWithExtensions,
  extensionsToDelete,
  folderPath,
} from "../utils/unlink";
import { hasEmptyField, createUserInfo, generateAccess } from "../helpers";
import User from "../models/user";

const profileSetup = async (req: Request, res: Response) => {
  try {
    const { name, username, gender, bio } = await req.body;
    const requestUser = req.user!;

    if (username !== requestUser?.username) {
      const existsUsername = await User.exists({ username });

      if (existsUsername) {
        throw new ApiError(409, "Username already exists!");
      }
    }

    const userDetails = { name, username, gender, bio, setup: false };
    const isCompleted = !hasEmptyField({ name, username, gender });

    if (isCompleted) {
      userDetails.setup = true;
    }

    const updatedProfile = await User.findByIdAndUpdate(
      requestUser?._id,
      userDetails,
      { new: true }
    );

    if (!updatedProfile) {
      throw new ApiError(400, "Profile setup not completed!");
    }

    const userInfo = createUserInfo(updatedProfile);

    if (!userInfo.setup) {
      return ApiResponse(res, 200, "Please, complete your profile!", userInfo);
    }

    generateAccess(res, userInfo);

    return ApiResponse(res, 200, "Profile updated successfully!", userInfo);
  } catch (error: any) {
    return ApiResponse(res, error.code, error.message);
  }
};

const updateImage = async (req: Request, res: Response) => {
  try {
    const requestUser = req.user;
    const imagePath = req.file?.path;

    if (!imagePath) {
      throw new ApiError(400, "Profile image file required!");
    }

    const [uploadImage, userProfile] = await Promise.all([
      uploadOnCloudinary(imagePath),
      User.findById(requestUser?._id),
    ]);

    if (!uploadImage || !uploadImage.url) {
      throw new ApiError(500, "Error while uploading profile image!");
    }

    if (userProfile && userProfile.image !== "") {
      await deleteImageByUrl(userProfile.image!);
    }

    if (userProfile && uploadImage.url) {
      userProfile.image = uploadImage.url;
      await userProfile.save({ validateBeforeSave: true });

      const userInfo = createUserInfo(userProfile);
      generateAccess(res, userInfo);

      return ApiResponse(
        res,
        200,
        "Profile image updated successfully!",
        userInfo
      );
    }
    throw new ApiError(500, "Profile image not updated!");
  } catch (error: any) {
    unlinkFilesWithExtensions(folderPath, extensionsToDelete);
    return ApiResponse(res, error.code, error.message);
  }
};

const deleteImage = async (req: Request, res: Response) => {
  try {
    const requestUser = await User.findById(req.user?._id);

    if (requestUser && requestUser.image !== "") {
      await deleteImageByUrl(requestUser.image!);

      requestUser.image = "";
      await requestUser.save({ validateBeforeSave: true });

      const userInfo = createUserInfo(requestUser);
      generateAccess(res, userInfo);

      return ApiResponse(
        res,
        200,
        "Profile image deleted successfully!",
        userInfo
      );
    }
    throw new ApiError(400, "Profile image not available!");
  } catch (error: any) {
    return ApiResponse(res, error.code, error.message);
  }
};

const changePassword = async (req: Request, res: Response) => {
  try {
    const { old_password, new_password } = await req.body;

    if (old_password === new_password) {
      throw new ApiError(400, "Please, choose a different password!");
    }

    const requestUser = await User.findById(req.user?._id).select("+password");

    if (!requestUser) {
      throw new ApiError(403, "Invalid authorization!");
    }

    const isCorrect = await compare(old_password, requestUser.password!);

    if (!isCorrect) {
      throw new ApiError(403, "Incorrect old password!");
    }

    const hashSalt = await genSalt(12);
    requestUser.password = await hash(new_password, hashSalt);
    await requestUser.save({ validateBeforeSave: true });

    const userInfo = createUserInfo(requestUser);
    generateAccess(res, userInfo);

    return ApiResponse(res, 200, "Password changed successfully!", userInfo);
  } catch (error: any) {
    return ApiResponse(res, error.code, error.message);
  }
};

const userInformation = async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    let message = user?.setup
      ? "User profile information!"
      : "Please, complete your profile!";

    return ApiResponse(res, 200, message, user);
  } catch (error: any) {
    return ApiResponse(res, error.code, error.message);
  }
};

export {
  profileSetup,
  updateImage,
  deleteImage,
  changePassword,
  userInformation,
};
