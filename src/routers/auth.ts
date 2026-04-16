import { Router } from "express";

import { authRefresh, signUpUser, signInUser, signOutUser } from "#/controllers/auth.js";
import { validate, limiter } from "#/middlewares/index.js";
import { signUpSchema, signInSchema } from "#/utils/schema.js";

const router = Router();

router.post("/sign-up", limiter(10, 5), validate(signUpSchema), signUpUser);
router.post("/sign-in", limiter(10, 10), validate(signInSchema), signInUser);
router.all("/sign-out", signOutUser);
router.get("/auth-refresh", authRefresh);

export default router;
