import { Router, Request, Response } from "express";
import { SuccessResponse } from "../utils/index.js";
import AuthRouter from "./auth.js";
import UserRouter from "./user.js";
import ContactRouter from "./contact.js";
import MessageRouter from "./message.js";

const router = Router();

router.use("/auth", AuthRouter);
router.use("/user", UserRouter);
router.use("/contact", ContactRouter);
router.use("/message", MessageRouter);

/** Just for server wake up from third party services */
router.get("/wakeup", (req: Request, res: Response) => {
  const from = (req.query.from as string) || "Unknown";
  return SuccessResponse(res, 200, `Wake up server by ${from}!`);
});

export default router;
