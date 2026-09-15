import { Router } from "express";
import limiter from "#/configs/limiter.js";
import upload from "#/configs/upload.js";
import { profileUpdate, updateImage, deleteImage, changePassword, userInformation } from "#/controllers/user.js";
import { authAccess, validate } from "#/middlewares/index.js";
import { profileSchema, passwordSchema } from "#/utilities/schema.js";

const router = Router();

router.use(limiter(10, 200), authAccess);

router.patch("/profile/update", validate(profileSchema), profileUpdate);
router.patch("/profile/image", upload.single("profile-image"), updateImage);
router.delete("/profile/image", deleteImage);
router.patch("/password", validate(passwordSchema), changePassword);
router.get("/profile", userInformation);

export default router;
