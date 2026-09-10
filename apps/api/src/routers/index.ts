import { Router } from "express";
import limiter from "#/configs/limiter.js";
import { authEvents } from "#/middlewares/index.js";
import { connectEvents } from "#/services/events.js";
import { formatBytes, formatUptime } from "#/utilities/helpers.js";
import { asyncHandler, HttpResponse } from "#/utilities/response.js";
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

const wakeupHandler = asyncHandler<any, any, any, { from?: string }>((req, res) => {
  const from = req.query.from ?? "Unknown";
  const ts = new Date().toISOString();
  return HttpResponse.success(res, 200, `Wake up server by ${from} at ${ts}!`);
});

const statsHandler = asyncHandler((_req, res) => {
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

  return HttpResponse.success(res, 200, "Runtime memory stats!", data);
});

router.get("/wakeup", wakeupHandler);
router.get("/stats", statsHandler);

export default router;
