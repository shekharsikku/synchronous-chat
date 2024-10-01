import { Router } from "express";
import { authAccess, upload } from "../middlewares";
import { validateSchema, profileSchema, passwordSchema } from "../utils/schema";
import {
  profileSetup,
  updateImage,
  deleteImage,
  changePassword,
  userInformation,
} from "../controllers/user";

const router = Router();

router.patch(
  "/user-profile-setup",
  authAccess,
  validateSchema(profileSchema),
  profileSetup
);

router.patch(
  "/update-profile-image",
  authAccess,
  upload.single("profile-image"),
  updateImage
);

router.patch(
  "/change-password",
  authAccess,
  validateSchema(passwordSchema),
  changePassword
);

router.delete("/delete-profile-image", authAccess, deleteImage);

router.get("/user-information", authAccess, userInformation);

export default router;
