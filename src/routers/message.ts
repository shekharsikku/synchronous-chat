import { Router } from "express";
import { authAccess, validate } from "../middlewares";
import { MessageSchema, TranslateSchema } from "../utils/schema";
import {
  deleteMessages,
  deleteMessage,
  editMessage,
  getMessages,
  sendMessage,
  translateMessage,
} from "../controllers/message";

const router = Router();

router.get("/:id", authAccess, getMessages);
router.post("/send/:id", authAccess, validate(MessageSchema), sendMessage);
router.patch("/edit/:id", authAccess, editMessage);
router.delete("/delete/:id", authAccess, deleteMessage);
router.delete("/delete", authAccess, deleteMessages);

/** For translate text message in prefer language */
router.post("/translate", validate(TranslateSchema), translateMessage);

export default router;
