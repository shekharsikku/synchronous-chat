import { Router } from "express";
import { searchContact, fetchContacts, fetchContact, availableContact } from "../controllers/contact.js";
import { authAccess } from "../middlewares/index.js";
const router = Router();
router.get("/search", authAccess, searchContact);
router.get("/fetch", authAccess, fetchContacts);
router.get("/fetch/:id", authAccess, fetchContact);
router.get("/available", authAccess, availableContact);
export default router;
