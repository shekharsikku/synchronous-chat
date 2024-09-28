import { server } from "./socket";
import mongodb from "./mongodb";
import job from "./utils/cron";
import env from "./utils/env";

const uri = env.MONGODB_URI;
const port = env.PORT;

(async () => {
  try {
    const state = await mongodb(uri);
    if (state == 1) {
      console.log("Database connection success!");
      job.start();
      server.listen(port, () => {
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
