import { Router, type Request, type Response } from "express";
import { authEvents, limiter } from "#/middlewares/index.js";
import { connectEvents } from "#/services/events.js";
import { formatBytes, formatUptime } from "#/utilities/helpers.js";
import { HttpResponse } from "#/utilities/response.js";
import authRouter from "./auth.js";
import contactRouter from "./contact.js";
import groupRouter from "./group.js";
import messageRouter from "./message.js";
import userRouter from "./user.js";
import pushRouter from "./push.js";

const router = Router();

router.use(limiter(10, 2000));

router.use("/auth", authRouter);
router.use("/user", userRouter);
router.use("/contact", contactRouter);
router.use("/group", groupRouter);
router.use("/message", messageRouter);
router.use("/push", pushRouter);
router.get("/events", authEvents, connectEvents);

router.get("/wakeup", (req: Request<{}, {}, {}, { from?: string }>, res: Response) => {
  const from = req.query["from"] || "Unknown";
  const timestamp = new Date().toISOString();
  return new HttpResponse(200, `Wake up server by ${from} at ${timestamp}!`).send(res);
});

router.get("/stats", async (_req: Request, res: Response) => {
  const memory = process.memoryUsage();

  const data = {
    timestamp: new Date().toISOString(),
    uptime: formatUptime(),
    memory: {
      rss: {
        bytes: memory.rss,
        human: formatBytes(memory.rss),
      },
      heap_total: {
        bytes: memory.heapTotal,
        human: formatBytes(memory.heapTotal),
      },
      heap_used: {
        bytes: memory.heapUsed,
        human: formatBytes(memory.heapUsed),
      },
      external: {
        bytes: memory.external,
        human: formatBytes(memory.external),
      },
      array_buffers: {
        bytes: memory.arrayBuffers,
        human: formatBytes(memory.arrayBuffers),
      },
    },
    node: process.version,
    pid: process.pid,
  };

  return new HttpResponse(200, "Runtime memory stats!", { data }).send(res);
});

export default router;
