import { connect } from "mongoose";
import { server } from "./socket.js";
import job from "./utils/cron.js";
import env from "./utils/env.js";
const uri = env.MONGODB_URI;
const port = env.PORT;
(async () => {
    try {
        const { connection } = await connect(uri);
        if (connection.readyState !== 1) {
            throw new Error("Database connection error!");
        }
        console.log("\nDatabase connection success!");
        job.start();
        server.listen(port, () => {
            console.log(`Server running on port: ${port}\n`);
        });
    }
    catch (error) {
        console.error(`Error: ${error.message}\n`);
        process.exit(1);
    }
})();
