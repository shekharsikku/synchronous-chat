import { Request, Response } from "express";
import { ApiError, ApiResponse } from "../utils";
import { deleteImageByUrl, uploadOnCloudinary } from "../utils/cloudinary";
import {
  unlinkFilesWithExtensions,
  extensionsToDelete,
  folderPath,
} from "../utils/unlink";
import {
  hasEmptyField,
  removeSpaces,
  generateHash,
  compareHash,
  maskedDetails,
  createAccessData,
  generateAccess,
} from "../helpers";
import { DetailInterface } from "../interface";
import User from "../models/user";

const profileSetup = async (req: Request, res: Response) => {
  try {
    const details = await req.body;
    const username = removeSpaces(details?.username);
    const requestUser = req.user!;

    if (username !== requestUser?.username) {
      const existsUsername = await User.findOne({ username });

      if (existsUsername) {
        throw new ApiError(409, "Username already exists!");
      }
    }

    const updateDetails: DetailInterface = {
      name: details.name,
      username,
      gender: details.gender,
      bio: details.bio,
    };

    const isEmpty = hasEmptyField({
      name: details.name,
      username,
      gender: details.gender,
    });

    if (!isEmpty) {
      updateDetails.setup = true;
    }

    const updatedProfile = await User.findByIdAndUpdate(
      requestUser?._id,
      { ...updateDetails },
      { new: true }
    );

    if (!updatedProfile) {
      throw new ApiError(400, "Profile setup not completed!");
    } else if (!updatedProfile.setup) {
      const userData = maskedDetails(updatedProfile);
      return ApiResponse(res, 200, "Please, complete your profile!", userData);
    }

    const accessData = createAccessData(updatedProfile);
    const accessToken = generateAccess(res, accessData);

    return ApiResponse(res, 200, "Profile updated successfully!", accessData);
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

    const uploadImage = await uploadOnCloudinary(imagePath);

    if (!uploadImage || !uploadImage.url) {
      throw new ApiError(500, "Error while uploading profile image!");
    }

    const userProfile = await User.findById(requestUser?._id);

    if (userProfile && userProfile.image !== "") {
      await deleteImageByUrl(userProfile.image!);
    }

    if (userProfile && uploadImage.url) {
      userProfile.image = uploadImage.url;
      await userProfile.save({ validateBeforeSave: true });

      const accessData = createAccessData(userProfile);
      const accessToken = generateAccess(res, accessData);

      return ApiResponse(
        res,
        200,
        "Profile image updated successfully!",
        accessData
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

      const accessData = createAccessData(requestUser);
      const accessToken = generateAccess(res, accessData);

      return ApiResponse(
        res,
        301,
        "Profile image deleted successfully!",
        accessData
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

    const requestUser = await User.findById(req.user?._id).select("+password");

    if (!requestUser) {
      throw new ApiError(403, "Invalid authorization!");
    }

    if (old_password === new_password) {
      throw new ApiError(400, "Please, choose a different password!");
    }

    const validatePassword = await compareHash(
      old_password,
      requestUser.password!
    );

    if (!validatePassword) {
      throw new ApiError(403, "Incorrect old password!");
    }

    const hashedPassword = await generateHash(new_password);

    requestUser.password = hashedPassword;
    await requestUser.save({ validateBeforeSave: true });

    const accessData = createAccessData(requestUser);
    const accessToken = generateAccess(res, accessData);

    return ApiResponse(res, 202, "Password changed successfully!", accessData);
  } catch (error: any) {
    return ApiResponse(res, error.code, error.message);
  }
};

const userInformation = async (req: Request, res: Response) => {
  try {
    const requestUser = req.user!;

    if (requestUser?.setup) {
      return ApiResponse(res, 200, "User profile information!", requestUser);
    }
    const userData = maskedDetails(requestUser);
    return ApiResponse(res, 200, "Please, complete your profile!", userData);
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
