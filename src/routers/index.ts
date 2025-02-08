import { translate } from "bing-translate-api";
import { Router, Request, Response } from "express";
import { ApiError, ApiResponse } from "../utils";
import AuthRouter from "./auth";
import UserRouter from "./user";
import ContactRouter from "./contact";
import MessageRouter from "./message";

const router = Router();

router.use("/auth", AuthRouter);
router.use("/user", UserRouter);
router.use("/contact", ContactRouter);
router.use("/message", MessageRouter);

/** Just for server wake up from third party services */
router.get("/wakeup", (req: Request, res: Response) => {
  const from = req.query.from;
  res.status(200).json({ message: `Wake up server from ${from}!` });
});

/** For translate text message in prefer language */
router.post("/translate", async (req: Request, res: Response) => {
  try {
    const { message, language } = await req.body;

    const result = await translate(message, null, language);

    if (!result) {
      throw new ApiError(500, "Error while translating message!");
    }

    return ApiResponse(
      res,
      200,
      "Text translated successfully!",
      result.translation
    );
  } catch (error: any) {
    return ApiResponse(res, error.code, error.message);
  }
});

export default router;
