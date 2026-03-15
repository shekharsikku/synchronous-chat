import { Router } from "express";

import { profileSetup, updateImage, deleteImage, changePassword, userInformation } from "#/controllers/user.js";
import { authAccess, upload, validate } from "#/middlewares/index.js";
import { ProfileSchema, PasswordSchema } from "#/utils/schema.js";

const router = Router();

router.patch("/profile-setup", authAccess, validate(ProfileSchema), profileSetup);
router.patch("/profile-image", authAccess, upload.single("profile-image"), updateImage);
router.patch("/change-password", authAccess, validate(PasswordSchema), changePassword);
router.delete("/profile-image", authAccess, deleteImage);
router.get("/user-information", authAccess, userInformation);

export default router;
