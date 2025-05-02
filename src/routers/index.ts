import { Router, Request, Response } from "express";
import AuthRouter from "./auth";
import UserRouter from "./user";
import ContactRouter from "./contact";
import MessageRouter from "./message";

const router = Router();

router.use("/auth", AuthRouter);
router.use("/user", UserRouter);
router.use("/contact", ContactRouter);
router.use("/message", MessageRouter);

/** Just for server wake up from third party services */
router.get("/wakeup", (req: Request, res: Response) => {
  const from = req.query.from;
  res.status(200).json({ message: `Wake up server from ${from}!` });
});

export default router;
