import { Router } from "express";
import { SuccessResponse } from "../utils/index.js";
import { limiter } from "../middlewares/index.js";
import AuthRouter from "./auth.js";
import UserRouter from "./user.js";
import ContactRouter from "./contact.js";
import MessageRouter from "./message.js";
import GroupRouter from "./group.js";
const router = Router();
router.use("/auth", limiter(10, 10), AuthRouter);
router.use("/user", limiter(10, 50), UserRouter);
router.use("/contact", limiter(10, 50), ContactRouter);
router.use("/message", limiter(10, 500), MessageRouter);
router.use("/group", limiter(10, 500), GroupRouter);
router.get("/wakeup", (req, res) => {
    const from = req.query.from || "Unknown";
    return SuccessResponse(res, 200, `Wake up server by ${from}!`);
});
export default router;
