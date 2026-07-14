import { Router } from "express";
import { subscribePush, unsubscribePush } from "#/controllers/push.js";
import { authAccess, validate, limiter } from "#/middlewares/index.js";
import { subscribeSchema, unsubscribeSchema } from "#/utilities/schema.js";

const router = Router();

router.use(limiter(10, 10), authAccess);

router.post("/subscribe", validate(subscribeSchema), subscribePush);
router.post("/unsubscribe", validate(unsubscribeSchema), unsubscribePush);

export default router;
