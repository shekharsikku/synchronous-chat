import { Router } from "express";

import { profileSetup, updateImage, deleteImage, changePassword, userInformation } from "#/controllers/user.js";
import { authAccess, upload, validate } from "#/middlewares/index.js";
import { profileSchema, passwordSchema } from "#/utils/schema.js";

const router = Router();

router.patch("/profile-setup", authAccess, validate(profileSchema), profileSetup);
router.patch("/profile-image", authAccess, upload.single("profile-image"), updateImage);
router.patch("/change-password", authAccess, validate(passwordSchema), changePassword);
router.delete("/profile-image", authAccess, deleteImage);
router.get("/user-information", authAccess, userInformation);

export default router;
