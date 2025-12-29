import { Router } from "express";

import { signUpUser, signInUser, signOutUser, refreshAuth } from "#/controllers/auth.js";
import { authAccess, authRefresh, validate } from "#/middlewares/index.js";
import { SignUpSchema, SignInSchema } from "#/utils/schema.js";

const router = Router();

router.post("/sign-up", validate(SignUpSchema), signUpUser);
router.post("/sign-in", validate(SignInSchema), signInUser);
router.delete("/sign-out", authAccess, signOutUser);
router.get("/auth-refresh", authRefresh, refreshAuth);

export default router;
