import { filesService } from "#/services/files.js";
import env from "#/configs/env.js";
import logger from "#/configs/logger.js";
import server from "#/server.js";
import jobs from "#/services/jobs.js";

const port = env.PORT;

(async () => {
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
