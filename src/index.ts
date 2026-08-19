import { connect } from "mongoose";
import env from "#/configs/env.js";
import logger from "#/configs/logger.js";
import server from "#/server.js";
import jobs from "#/services/jobs.js";

const uri = env.MONGODB_URI;
const port = env.PORT;

void (async () => {
  try {
    const { connection } = await connect(uri);

    if (connection.readyState !== 1) {
      throw new Error("Database connection error!");
    }

    logger.info("Database connection success!");

    jobs.start();

    server.on("error", (err) => {
      logger.error({ err }, "Server failed to start!");
      process.exit(1);
    });

    server.listen(port, () => {
      logger.info("Server running on port: %s", port);
    });
  } catch (err) {
    logger.error({ err }, "Server startup failed!");
    process.exit(1);
  }
})();
