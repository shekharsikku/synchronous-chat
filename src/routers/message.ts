import { Router } from "express";
import {
  deleteMessages,
  deleteMessage,
  reactMessage,
  editMessage,
  getMessages,
  sendMessage,
  translateMessage,
  fetchMessages,
} from "#/controllers/message.js";
import { authAccess, validate, limiter } from "#/middlewares/index.js";
import { messageSchema, translateSchema } from "#/utilities/schema.js";

const router = Router();

router.use(limiter(10, 1000), authAccess);

router.post("/send/:id", validate(messageSchema), sendMessage);
router.get("/get/:id", getMessages);
router.get("/fetch/:id", fetchMessages);
router.patch("/edit/:id", editMessage);
router.patch("/react/:id", reactMessage);
router.delete("/delete/:id", deleteMessage);
router.delete("/delete", deleteMessages);
router.post("/translate", validate(translateSchema), translateMessage);

export default router;
