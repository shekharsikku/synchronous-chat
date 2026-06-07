import { Router, type Request, type Response } from "express";
import { authEvents, limiter } from "#/middlewares/index.js";
import authRouter from "#/routers/auth.js";
import contactRouter from "#/routers/contact.js";
import groupRouter from "#/routers/group.js";
import messageRouter from "#/routers/message.js";
import userRouter from "#/routers/user.js";
import subscriptionRouter from "#/routers/subscription.js";
import { connectEvents } from "#/services/events.js";
import { HttpResponse } from "#/utils/response.js";

const router = Router();

router.use("/auth", limiter(10, 100), authRouter);
router.use("/user", limiter(10, 100), userRouter);
router.use("/contact", limiter(10, 100), contactRouter);
router.use("/message", limiter(10, 500), messageRouter);
router.use("/group", limiter(10, 500), groupRouter);
router.use("/push", limiter(10, 10), subscriptionRouter);
router.get("/events", authEvents, connectEvents);

router.get("/wakeup", (req: Request<{}, {}, {}, { from?: string }>, res: Response) => {
  const from = req.query["from"] || "Unknown";
  const timestamp = new Date().toISOString();
  return new HttpResponse(200, `Wake up server by ${from} at ${timestamp}!`).send(res);
});

export default router;
