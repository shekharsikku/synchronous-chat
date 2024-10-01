import { Router } from "express";
import { authAccess } from "../middlewares";
import {
  getAllContacts,
  searchContact,
  getContactsList,
} from "../controllers/contact";

const router = Router();

router.post("/search", authAccess, searchContact);
router.get("/get-all", authAccess, getAllContacts);
router.get("/dm-contacts", authAccess, getContactsList);

export default router;
