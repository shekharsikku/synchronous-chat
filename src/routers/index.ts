import { Router, type Request, type Response } from "express";
import { authEvents, limiter } from "#/middlewares/index.js";
import authRouter from "#/routers/auth.js";
import contactRouter from "#/routers/contact.js";
import groupRouter from "#/routers/group.js";
import messageRouter from "#/routers/message.js";
import userRouter from "#/routers/user.js";
import { connectEvents } from "#/services/events.js";
import { ApiResponse } from "#/utils/helpers.js";

const router = Router();

router.use("/auth", limiter(10, 100), authRouter);
router.use("/user", limiter(10, 100), userRouter);
router.use("/contact", limiter(10, 100), contactRouter);
router.use("/message", limiter(10, 500), messageRouter);
router.use("/group", limiter(10, 500), groupRouter);

/** Just for server wake up from third party services */
router.get("/wakeup", (req: Request, res: Response) => {
  const from = (req.query["from"] as string) || "Unknown";
  const timestamp = new Date().toISOString();
  return new ApiResponse(200, `Wake up server by ${from} at ${timestamp}!`).send(res);
});

/** Just for test sse in synchronous chat application */
router.get("/events", authEvents, connectEvents);

export default router;
