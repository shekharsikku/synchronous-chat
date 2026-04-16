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
import { createGroupSchema, updateDetailsSchema, updateMembersSchema } from "#/utils/schema.js";

const router = Router();

router.post("/create", limiter(10, 5), validate(createGroupSchema), authAccess, createGroup);
router.patch("/update/:id/details", limiter(10, 10), validate(updateDetailsSchema), authAccess, updateDetails);
router.patch("/update/:id/members", limiter(10, 10), validate(updateMembersSchema), authAccess, updateMembers);
router.patch("/update/:id/avatar", limiter(10, 5), authAccess, upload.single("group-avatar"), updateAvatar);
router.delete("/delete/:id/avatar", limiter(10, 5), authAccess, deleteAvatar);
router.get("/fetch", limiter(10, 50), authAccess, fetchGroups);

export default router;
