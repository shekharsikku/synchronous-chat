import { connect } from "mongoose";

import logger from "#/middlewares/logger.js";
import server from "#/server.js";
import jobs from "#/services/jobs.js";
import env from "#/utils/env.js";

const uri = env.MONGODB_URI;
const port = env.PORT;

void (async () => {
  try {
    /** Connection state returned by mongoose. */
    const { connection } = await connect(uri);

    /** Checking connection state of mongodb. */
    if (connection.readyState !== 1) {
      /** If database not connected throw error */
      throw new Error("Database connection error!");
    }

    /** Database connection success log. */
    logger.info("Database connection success!");

    /** Starting cron jobs schedules. */
    jobs.start();

    /** Listening express/socket.io server */
    server.listen(port, () => {
      /** Server running information log. */
      logger.info("Server running on port: %s", port);
    });
  } catch (err) {
    logger.error({ err }, "Server startup failed!");
    process.exit(1);
  }
})();
