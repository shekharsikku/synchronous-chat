import { Router } from "express";
import { ProfileSchema, PasswordSchema } from "@utils/schema.js";
import { authAccess, upload, validate } from "@middlewares/index.js";
import { profileSetup, updateImage, deleteImage, changePassword, userInformation } from "@controllers/user.js";

const router = Router();

router.patch("/user-profile-setup", authAccess, validate(ProfileSchema), profileSetup);
router.patch("/update-profile-image", authAccess, upload.single("profile-image"), updateImage);
router.patch("/change-password", authAccess, validate(PasswordSchema), changePassword);
router.delete("/delete-profile-image", authAccess, deleteImage);
router.get("/user-information", authAccess, userInformation);

export default router;
