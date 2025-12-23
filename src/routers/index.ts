import { Router, type Request, type Response } from "express";
import { SuccessResponse } from "@utils/response.js";
import { limiter } from "@middlewares/index.js";
import AuthRouter from "@routers/auth.js";
import UserRouter from "@routers/user.js";
import ContactRouter from "@routers/contact.js";
import MessageRouter from "@routers/message.js";
import GroupRouter from "@routers/group.js";

const router = Router();

router.use("/auth", limiter(10, 10), AuthRouter);
router.use("/user", limiter(10, 50), UserRouter);
router.use("/contact", limiter(10, 50), ContactRouter);
router.use("/message", limiter(10, 500), MessageRouter);
router.use("/group", limiter(10, 500), GroupRouter);

/** Just for server wake up from third party services */
router.get("/wakeup", (req: Request, res: Response) => {
  const from = (req.query.from as string) || "Unknown";
  const timestamp = new Date().toISOString();
  return SuccessResponse(res, 200, `Wake up server by ${from} at ${timestamp}!`);
});

export default router;
