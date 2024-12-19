import { Router } from "express";
import { authAccess } from "../middlewares";
import {
  searchContact,
  fetchContacts,
  availableContact,
} from "../controllers/contact";

const router = Router();

router.get("/search", authAccess, searchContact);
router.get("/fetch", authAccess, fetchContacts);
router.get("/available", authAccess, availableContact);

export default router;
