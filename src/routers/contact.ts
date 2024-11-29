import { Router } from "express";
import { authAccess } from "../middlewares";
import { searchContact, fetchContacts } from "../controllers/contact";

const router = Router();

router.post("/search", authAccess, searchContact);
router.get("/fetch", authAccess, fetchContacts);

export default router;
