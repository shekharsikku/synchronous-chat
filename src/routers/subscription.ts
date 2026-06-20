import { Router } from "express";
import { subscribe, unsubscribe } from "#/controllers/subscription.js";
import { authAccess, validate } from "#/middlewares/index.js";
import { subscribeSchema, unsubscribeSchema } from "#/utilities/schema.js";

const router = Router();

router.post("/subscribe", authAccess, validate(subscribeSchema), subscribe);
router.post("/unsubscribe", authAccess, validate(unsubscribeSchema), unsubscribe);

export default router;
