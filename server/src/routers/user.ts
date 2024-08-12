import { Router } from "express";
import { validateSchema } from "../helpers";
import { accessToken, upload } from "../middlewares";
import { profileSetupSchema } from "../utils/schema";
import {
  userProfileSetup,
  updateProfileImage,
  deleteProfileImage,
  getUserInformation,
  changePassword,
} from "../controllers/user";

const router = Router();

router.patch(
  "/user-profile-setup",
  accessToken,
  validateSchema(profileSetupSchema),
  userProfileSetup
);

router.patch(
  "/update-profile-image",
  accessToken,
  upload.single("profile-image"),
  updateProfileImage
);

router.patch("/change-password", accessToken, changePassword);

router.delete("/delete-profile-image", accessToken, deleteProfileImage);

router.get("/user-information", accessToken, getUserInformation);

export default router;
