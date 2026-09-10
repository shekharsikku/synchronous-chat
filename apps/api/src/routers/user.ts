import { Router } from "express";
import limiter from "#/configs/limiter.js";
import upload from "#/configs/upload.js";
import { profileSetup, updateImage, deleteImage, changePassword, userInformation } from "#/controllers/user.js";
import { authAccess, validate } from "#/middlewares/index.js";
import { profileSchema, passwordSchema } from "#/utilities/schema.js";

const router = Router();

router.use(limiter(10, 200), authAccess);

router.patch("/profile-setup", validate(profileSchema), profileSetup);
router.patch("/profile-image", upload.single("profile-image"), updateImage);
router.patch("/change-password", validate(passwordSchema), changePassword);
router.delete("/profile-image", deleteImage);
router.get("/user-information", userInformation);

export default router;
