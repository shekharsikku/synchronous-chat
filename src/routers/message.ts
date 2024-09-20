import { Router } from "express";
import { accessToken } from "../middlewares";
import {
  deleteMessage,
  deleteMessages,
  getMessages,
  sendMessage,
} from "../controllers/message";

const router = Router();

router.get("/:id", accessToken, getMessages);
router.post("/send/:id", accessToken, sendMessage);
router.delete("/delete/:id", accessToken, deleteMessage);
router.delete("/delete", accessToken, deleteMessages);

export default router;
