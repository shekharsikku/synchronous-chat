import { Router } from "express";
import limiter from "#/configs/limiter.js";
import { searchContact, fetchContacts, fetchContact, availableContact } from "#/controllers/contact.js";
import { authAccess } from "#/middlewares/index.js";

const router = Router();

router.use(limiter(10, 200), authAccess);

router.get("/search", searchContact);
router.get("/fetch", fetchContacts);
router.get("/fetch/:id", fetchContact);
router.get("/available", availableContact);

export default router;
