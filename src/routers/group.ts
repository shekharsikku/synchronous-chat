import { Router } from "express";

import { createGroup, updateDetails, updateMembers, fetchGroups } from "#/controllers/group.js";
import { authAccess, validate, limiter } from "#/middlewares/index.js";
import { CreateGroupSchema, UpdateDetailsSchema, UpdateMembersSchema } from "#/utils/schema.js";

const router = Router();

router.post("/create", limiter(10, 5), validate(CreateGroupSchema), authAccess, createGroup);
router.patch("/update/:id/details", limiter(10, 10), validate(UpdateDetailsSchema), authAccess, updateDetails);
router.patch("/update/:id/members", limiter(10, 10), validate(UpdateMembersSchema), authAccess, updateMembers);
router.get("/fetch", limiter(10, 50), authAccess, fetchGroups);

export default router;
