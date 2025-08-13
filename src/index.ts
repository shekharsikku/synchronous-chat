import { connect } from "mongoose";
import { server } from "./socket.js";
import job from "./utils/cron.js";
import env from "./utils/env.js";

const uri = env.MONGODB_URI;
const port = env.PORT;

(async () => {
  try {
    /** Connection state returned by mongoose. */
    const { connection } = await connect(uri);

    /** Checking connection state of mongodb. */
    if (connection.readyState !== 1) {
      /** If database not connected throw error */
      throw new Error("Database connection error!");
    }

    /** Database connection success log. */
    console.log("\nDatabase connection success!");

    /** Starting cron job schedules. */
    job.start();

    /** Listening express/socket.io server */
    server.listen(port, () => {
      /** Server running information log. */
      console.log(`Server running on port: ${port}\n`);
    });
  } catch (error: any) {
    console.error(`Error: ${error.message}\n`);
    process.exit(1);
  }
})();
