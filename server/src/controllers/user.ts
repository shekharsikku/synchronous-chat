import { Request, Response } from "express";
import { ApiError, ApiResponse } from "../utils";
import { deleteImageByUrl, uploadOnCloudinary } from "../utils/cloudinary";
import {
  unlinkFilesWithExtensions,
  extensionsToDelete,
  folderPath,
} from "../utils/unlink";
import User from "../models/user";
import {
  generateToken,
  hasEmptyField,
  generateHash,
  compareHash,
} from "../helpers";
import { UserProfileInterface, UserTokenInterface } from "../interface";

const userProfileSetup = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const dataBody = await req.body;

    if (dataBody.email) {
      throw new ApiError(403, "Cannot change email!");
    }

    if (dataBody.username && dataBody.username !== req.user?.username) {
      const existedUsername = await User.findOne({
        username: dataBody.username,
      });

      if (existedUsername) {
        throw new ApiError(409, "Username already exists!");
      }
    }

    const updatedProfile = await User.findByIdAndUpdate(
      userId,
      { ...dataBody },
      { new: true }
    );

    if (updatedProfile) {
      const userProfileFields: UserProfileInterface = {
        email: updatedProfile.email,
        username: updatedProfile.username,
        fullName: updatedProfile.fullName,
      };

      const validateResult = hasEmptyField(userProfileFields);

      if (!validateResult) {
        userProfileFields._id = updatedProfile._id;
        userProfileFields.imageUrl = updatedProfile.imageUrl;
        userProfileFields.profileColor = updatedProfile.profileColor;

        const { access, refresh } = generateToken(
          req,
          res,
          updatedProfile._id,
          false
        );

        updatedProfile.profileSetup = false;
        updatedProfile.refreshToken = refresh;
        await updatedProfile.save({ validateBeforeSave: false });

        userProfileFields.authToken = { access, refresh };

        return ApiResponse(
          req,
          res,
          200,
          "Profile setup completed successfully!",
          userProfileFields
        );
      }
    }
    throw new ApiError(400, "Profile setup not completed!");
  } catch (error: any) {
    return ApiResponse(req, res, error.code, error.message);
  }
};

const updateProfileImage = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const profileImagePath = req.file?.path;

    if (!profileImagePath) {
      throw new ApiError(400, "Profile image file required!");
    }

    const uploadImage = await uploadOnCloudinary(profileImagePath);

    if (!uploadImage || !uploadImage.url) {
      throw new ApiError(500, "Error while uploading profile image!");
    }

    const userProfile = await User.findById(userId);

    if (userProfile && userProfile.imageUrl !== "") {
      await deleteImageByUrl(userProfile.imageUrl!);
    }

    if (userProfile && uploadImage.url) {
      userProfile.imageUrl = uploadImage.url;
      await userProfile.save({ validateBeforeSave: false });

      const tokens: UserTokenInterface = req.token!;
      const responseData: UserProfileInterface = {
        _id: userProfile._id,
        email: userProfile.email,
        username: userProfile.username,
        fullName: userProfile.fullName,
        imageUrl: userProfile.imageUrl,
        profileColor: userProfile.profileColor,
        profileSetup: userProfile.profileSetup,
        authToken: tokens,
      };

      return ApiResponse(
        req,
        res,
        200,
        "Profile image updated successfully!",
        responseData
      );
    }
    throw new ApiError(500, "Profile image not updated!");
  } catch (error: any) {
    unlinkFilesWithExtensions(folderPath, extensionsToDelete);
    return ApiResponse(req, res, error.code, error.message);
  }
};

const deleteProfileImage = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const userProfile = await User.findById(userId);

    if (userProfile && userProfile.imageUrl !== "") {
      await deleteImageByUrl(userProfile.imageUrl!);
      userProfile.imageUrl = "";
      await userProfile.save({ validateBeforeSave: false });
      return ApiResponse(req, res, 301, "Profile image deleted successfully!");
    }
    throw new ApiError(400, "Profile image not available!");
  } catch (error: any) {
    return ApiResponse(req, res, error.code, error.message);
  }
};

const getUserInformation = async (req: Request, res: Response) => {
  try {
    const data = req.user!;
    const tokens: UserTokenInterface = req.token!;

    const responseData: UserProfileInterface = {
      _id: data._id,
      email: data.email,
      username: data.username,
      fullName: data.fullName,
      imageUrl: data.imageUrl,
      profileColor: data.profileColor,
      profileSetup: data.profileSetup,
      authToken: tokens,
    };

    return ApiResponse(
      req,
      res,
      200,
      "User profile information!",
      responseData
    );
  } catch (error: any) {
    return ApiResponse(req, res, error.code, error.message);
  }
};

const changePassword = async (req: Request, res: Response) => {
  try {
    const { old_password, new_password } = await req.body;

    const user = await User.findById(req.user?._id).select("+password");

    if (!user) {
      throw new ApiError(403, "Invalid change request!");
    }

    const checked = await compareHash(old_password, user?.password!);

    if (!checked) {
      throw new ApiError(403, "Invalid old password!");
    }

    user.password = await generateHash(new_password);
    await user.save({ validateBeforeSave: false });

    return ApiResponse(req, res, 202, "Password changed successfully!");
  } catch (error: any) {
    return ApiResponse(req, res, error.code, error.message);
  }
};

export {
  userProfileSetup,
  updateProfileImage,
  deleteProfileImage,
  getUserInformation,
  changePassword,
};
