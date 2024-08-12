import { Router } from "express";
import { accessToken } from "../middlewares";
import {
  getAllContacts,
  searchContact,
  getContactsList,
} from "../controllers/contact";

const router = Router();

router.post("/search", accessToken, searchContact);
router.get("/get-all", accessToken, getAllContacts);
router.get("/dm-contacts", accessToken, getContactsList);

export default router;
