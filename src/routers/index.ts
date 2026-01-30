import { Router, type Request, type Response } from "express";

import { authEvents, limiter } from "#/middlewares/index.js";
import AuthRouter from "#/routers/auth.js";
import ContactRouter from "#/routers/contact.js";
import GroupRouter from "#/routers/group.js";
import MessageRouter from "#/routers/message.js";
import UserRouter from "#/routers/user.js";
import { connectEvents } from "#/services/events.js";
import { SuccessResponse } from "#/utils/response.js";

const router = Router();

router.use("/auth", limiter(10, 100), AuthRouter);
router.use("/user", limiter(10, 100), UserRouter);
router.use("/contact", limiter(10, 100), ContactRouter);
router.use("/message", limiter(10, 500), MessageRouter);
router.use("/group", limiter(10, 500), GroupRouter);

/** Just for server wake up from third party services */
router.get("/wakeup", (req: Request, res: Response) => {
  const from = (req.query.from as string) || "Unknown";
  const timestamp = new Date().toISOString();
  return SuccessResponse(res, 200, `Wake up server by ${from} at ${timestamp}!`);
});

/** Just for test sse in synchronous chat application */
router.get("/events", authEvents, connectEvents);

export default router;
