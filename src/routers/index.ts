import { Router } from "express";
import AuthRouter from "./auth";
import UserRouter from "./user";
import ContactRouter from "./contact";
import MessageRouter from "./message";

const router = Router();

router.use("/auth", AuthRouter);
router.use("/user", UserRouter);
router.use("/contact", ContactRouter);
router.use("/message", MessageRouter);

/** Just for testing encryption api endpoint */
import { TestEncryption } from "../utils/encryption";
router.all("/encryption", TestEncryption);

export default router;
