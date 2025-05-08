import { server } from "./socket.js";
import mongodb from "./mongodb/index.js";
import job from "./utils/cron.js";
import env from "./utils/env.js";
const uri = env.MONGODB_URI;
const port = env.PORT;
(async () => {
    try {
        const state = await mongodb(uri);
        if (state === 1) {
            console.log("\nDatabase connection success!");
            job.start();
            server.listen(port, () => {
                console.log(`Server running on port: ${port}\n`);
            });
        }
        else {
            throw new Error("Database connection error!");
        }
    }
    catch (error) {
        console.error(`Error: ${error.message}\n`);
        process.exit(1);
    }
})();
