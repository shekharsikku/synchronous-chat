import { Router } from "express";
import { authAccess } from "../middlewares";
import {
  deleteMessage,
  deleteMessages,
  getMessages,
  sendMessage,
} from "../controllers/message";

const router = Router();

router.get("/:id", authAccess, getMessages);
router.post("/send/:id", authAccess, sendMessage);
router.delete("/delete/:id", authAccess, deleteMessage);
router.delete("/delete", authAccess, deleteMessages);

export default router;
