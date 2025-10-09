import { Router } from "express";
import { authAccess, validate, limiter } from "../middlewares/index.js";
import { MessageSchema, TranslateSchema } from "../utils/schema.js";
import {
  deleteMessages,
  deleteMessage,
  reactMessage,
  editMessage,
  getMessages,
  sendMessage,
  translateMessage,
  fetchMessages,
} from "../controllers/message.js";

const router = Router();

router.get("/:id", limiter(1, 20), authAccess, getMessages);
router.get("/fetch/:id", limiter(1, 60), authAccess, fetchMessages);
router.post("/send/:id", limiter(1, 100), authAccess, validate(MessageSchema), sendMessage);
router.patch("/edit/:id", limiter(1, 20), authAccess, editMessage);
router.patch("/react/:id", limiter(1, 100), authAccess, reactMessage);
router.delete("/delete/:id", limiter(1, 20), authAccess, deleteMessage);
router.delete("/delete", limiter(10, 5), authAccess, deleteMessages);

/** For translate text message in prefer language */
router.post("/translate", validate(TranslateSchema), translateMessage);

export default router;
