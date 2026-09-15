import { filesService } from "#/services/files.js";
import env from "#/configs/env.js";
import logger from "#/configs/logger.js";
import server from "#/server.js";
import jobs from "#/services/jobs.js";

const port = env.PORT;

const shutdown = async (signal: string) => {
  logger.info("Shutdown signal received: %s", signal);

  jobs.stop();

  try {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    logger.info("Server shutdown completed!");

    await filesService.close();

    logger.info("Graceful shutdown completed!");
    process.exit(0);
  } catch (err) {
    logger.error({ err }, "Graceful shutdown failed!");
    process.exit(1);
  }
};

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

void (async () => {
  try {
    await filesService.connect();

    jobs.start();

    server.listen(port, () => {
      logger.info("Server running on port: %s", port);
    });
  } catch (err) {
    logger.error({ err }, "Server startup failed!");
    process.exit(1);
  }
})();
