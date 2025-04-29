import { Router } from "express";
import { authAccess, authRefresh } from "../middlewares";
import { validateSchema, signUpSchema, signInSchema } from "../utils/schema";
import {
  signUpUser,
  signInUser,
  signOutUser,
  refreshAuth,
} from "../controllers/auth";

const router = Router();

router.post("/sign-up", validateSchema(signUpSchema), signUpUser);
router.post("/sign-in", validateSchema(signInSchema), signInUser);
router.delete("/sign-out", authAccess, signOutUser);
router.get("/auth-refresh", authRefresh, refreshAuth);

export default router;
