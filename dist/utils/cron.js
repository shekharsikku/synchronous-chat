import { CronJob } from "cron";
import { User, Message, Conversation } from "../models/index.js";
import env from "../utils/env.js";
const job = new CronJob("0 0 0 * * *", async () => {
    try {
        const calculatePastDate = (daysAgo) => {
            const taskDate = new Date();
            taskDate.setDate(taskDate.getDate() - daysAgo);
            return taskDate;
        };
        const currentDate = new Date();
        const threeDaysAgo = calculatePastDate(3);
        const sevenDaysAgo = calculatePastDate(7);
        const fourteenDaysAgo = calculatePastDate(14);
        const [authentication, profiles, messages, conversations] = await Promise.all([
            User.updateMany({ "authentication.expiry": { $lt: currentDate } }, { $pull: { authentication: { expiry: { $lt: currentDate } } } }),
            User.deleteMany({ setup: false, createdAt: { $lt: threeDaysAgo } }),
            Message.deleteMany({ createdAt: { $lt: sevenDaysAgo } }),
            Conversation.deleteMany({ interaction: { $lt: fourteenDaysAgo } }),
        ]);
        if (env.isDev) {
            console.log("Result:", {
                authentication,
                conversations,
                messages,
                profiles,
            });
        }
    }
    catch (error) {
        console.log(`Error: ${error.message}`);
    }
    finally {
        console.log(`Schedule: ${new Date().toString()}`);
    }
}, null, false, "Asia/Kolkata");
export default job;
