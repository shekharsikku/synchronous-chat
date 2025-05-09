import { server } from "./socket.js";
import mongodb from "./mongodb/index.js";
import job from "./utils/cron.js";
import env from "./utils/env.js";

const uri = env.MONGODB_URI;
const port = env.PORT;

(async () => {
  try {
    /** Connection state returned by mongoose. */
    const state = await mongodb(uri);

    /** Checking connection state of mongodb. */
    if (state === 1) {
      /** Database connection success log. */
      console.log("\nDatabase connection success!");

      /** Starting cron job schedules. */
      job.start();

      /** Listening express/socket.io server */
      server.listen(port, () => {
        /** Server running information log. */
        console.log(`Server running on port: ${port}\n`);
      });
    } else {
      throw new Error("Database connection error!");
    }
  } catch (error: any) {
    console.error(`Error: ${error.message}\n`);
    process.exit(1);
  }
})();
