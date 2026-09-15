import { Router } from "express";
import limiter from "#/configs/limiter.js";
import upload from "#/configs/upload.js";
import { uploadFile, getFile, deleteFile } from "#/controllers/files.js";
import { authUser } from "#/middlewares/index.js";

const router = Router();

router.post("/", limiter(5, 100), authUser, upload.single("file"), uploadFile);
router.get("/:fid", limiter(1, 100), getFile);
router.delete("/:fid", limiter(5, 100), authUser, deleteFile);

export default router;
