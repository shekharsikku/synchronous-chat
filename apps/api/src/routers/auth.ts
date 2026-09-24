import { Router } from "express";
import limiter from "#/configs/limiter.js";
import { authRetrieve, authRefresh, signUpUser, signInUser, signOutUser } from "#/controllers/auth.js";
import { authAccess, validate } from "#/middlewares/index.js";
import { signUpSchema, signInSchema } from "#/utilities/schema.js";

const router = Router();

router.post("/signup", limiter(20, 10), validate(signUpSchema), signUpUser);
router.post("/signin", limiter(10, 10), validate(signInSchema), signInUser);
router.all("/signout", limiter(10, 20), signOutUser);
router.get("/refresh", limiter(10, 20), authRefresh);
router.get("/retrieve", limiter(10, 20), authAccess, authRetrieve);

export default router;
