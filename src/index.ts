import { server } from "./socket";
import mongodb from "./mongodb";
import env from "./utils/env";
import job from "./utils/cron";

const uri = env.MONGODB_URI;
const port = env.PORT;

(async () => {
  try {
    const state = await mongodb(uri);
    if (state == 1) {
      job.start();
      server.listen(port, () => {
        console.log(`🚀 Server running on port: ${port}\n`);
      });
    } else {
      throw new Error("Invalid connection state!");
    }
  } catch (error: any) {
    console.error(`Error: ${error.message}\n`);
    process.exit(1);
  }
})();
