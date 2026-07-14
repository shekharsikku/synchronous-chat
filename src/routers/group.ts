import { Router } from "express";
import {
  createGroup,
  updateDetails,
  updateMembers,
  updateAvatar,
  fetchGroups,
  deleteAvatar,
} from "#/controllers/group.js";
import { authAccess, upload, validate, limiter } from "#/middlewares/index.js";
import { createGroupSchema, updateDetailsSchema, updateMembersSchema } from "#/utilities/schema.js";

const router = Router();

router.use(limiter(10, 200), authAccess);

router.post("/create", validate(createGroupSchema), createGroup);
router.patch("/update/:id/details", validate(updateDetailsSchema), updateDetails);
router.patch("/update/:id/members", validate(updateMembersSchema), updateMembers);
router.patch("/update/:id/avatar", upload.single("group-avatar"), updateAvatar);
router.delete("/delete/:id/avatar", deleteAvatar);
router.get("/fetch", fetchGroups);

export default router;
