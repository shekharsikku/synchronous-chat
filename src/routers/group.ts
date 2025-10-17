import { Router } from "express";
import { authAccess, validate, limiter } from "../middlewares/index.js";
import { CreateGroupSchema, UpdateDetailsSchema, UpdateMembersSchema, MessageSchema } from "../utils/schema.js";
import { createGroup, updateDetails, updateMembers, fetchGroups, groupMessage } from "../controllers/group.js";

const router = Router();

router.post("/create", limiter(10, 5), validate(CreateGroupSchema), authAccess, createGroup);
router.patch("/update/:id/details", limiter(10, 10), validate(UpdateDetailsSchema), authAccess, updateDetails);
router.patch("/update/:id/members", limiter(10, 10), validate(UpdateMembersSchema), authAccess, updateMembers);

router.post("/message/send/:id", limiter(1, 100), validate(MessageSchema), authAccess, groupMessage);

// router.patch("/remove-avatar", authAccess, removeAvatar);

router.get("/fetch", limiter(10, 50), authAccess, fetchGroups);

export default router;
