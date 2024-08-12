import { Router } from "express";
import { validateSchema } from "../helpers";
import { accessToken, refreshToken } from "../middlewares";
import { signUpSchema, signInSchema } from "../utils/schema";
import {
  signUpUser,
  signInUser,
  signOutUser,
  authRefresh,
} from "../controllers/auth";

const router = Router();

router.post("/sign-up", validateSchema(signUpSchema), signUpUser);
router.post("/sign-in", validateSchema(signInSchema), signInUser);
router.delete("/sign-out", accessToken, signOutUser);
router.get("/auth-refresh", refreshToken, authRefresh);

export default router;
