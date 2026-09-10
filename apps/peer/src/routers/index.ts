import { Router } from "express";
import { formatBytes, formatUptime } from "#/utilities/helpers.js";
import { asyncHandler, HttpResponse } from "#/utilities/response.js";
import filesRoutes from "./files.js";

const router = Router();

router.use("/files", filesRoutes);

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
