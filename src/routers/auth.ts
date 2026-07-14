import { Router } from "express";
import { authRefresh, signUpUser, signInUser, signOutUser } from "#/controllers/auth.js";
import { validate, limiter } from "#/middlewares/index.js";
import { signUpSchema, signInSchema } from "#/utilities/schema.js";

const router = Router();

router.post("/sign-up", limiter(20, 10), validate(signUpSchema), signUpUser);
router.post("/sign-in", limiter(10, 10), validate(signInSchema), signInUser);
router.all("/sign-out", limiter(10, 20), signOutUser);
router.get("/auth-refresh", limiter(10, 20), authRefresh);

export default router;
