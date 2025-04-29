import { Router } from "express";
import { authAccess } from "../middlewares";
import {
  deleteMessages,
  deleteMessage,
  editMessage,
  getMessages,
  sendMessage,
} from "../controllers/message";

const router = Router();

router.get("/:id", authAccess, getMessages);
router.post("/send/:id", authAccess, sendMessage);
router.patch("/edit/:id", authAccess, editMessage);
router.delete("/delete/:id", authAccess, deleteMessage);
router.delete("/delete", authAccess, deleteMessages);

export default router;
