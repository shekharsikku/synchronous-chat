import { Router, type Request, type Response } from "express";
import { SuccessResponse } from "../utils/index.js";
import { limiter } from "../middlewares/index.js";
import AuthRouter from "./auth.js";
import UserRouter from "./user.js";
import ContactRouter from "./contact.js";
import MessageRouter from "./message.js";

const router = Router();

router.use("/auth", limiter(10, 10), AuthRouter);
router.use("/user", limiter(10, 50), UserRouter);
router.use("/contact", limiter(10, 50), ContactRouter);
router.use("/message", limiter(10, 500), MessageRouter);

/** Just for server wake up from third party services */
router.get("/wakeup", (req: Request, res: Response) => {
  const from = (req.query.from as string) || "Unknown";
  return SuccessResponse(res, 200, `Wake up server by ${from}!`);
});

export default router;
