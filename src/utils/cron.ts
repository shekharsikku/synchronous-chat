import { CronJob } from "cron";
import { User, Message, Conversation } from "../models/index.js";
import env from "../utils/env.js";

const job = new CronJob(
  "0 0 0 * * *",
  async () => {
    try {
      const calculatePastDate = (daysAgo: number) => {
        const taskDate = new Date();
        taskDate.setDate(taskDate.getDate() - daysAgo);
        return taskDate;
      };

      const currentDate = new Date();
      const thirtyDaysAgo = calculatePastDate(30);
      const sevenDaysAgo = calculatePastDate(7);
      const fourteenDaysAgo = calculatePastDate(14);

      const [authentication, profiles, messages, conversations] = await Promise.all([
        User.updateMany(
          { "authentication.expiry": { $lt: currentDate } },
          { $pull: { authentication: { expiry: { $lt: currentDate } } } }
        ),
        User.deleteMany({ setup: false, createdAt: { $lt: sevenDaysAgo } }),
        Message.deleteMany({ createdAt: { $lt: fourteenDaysAgo } }),
        Conversation.deleteMany({ interaction: { $lt: thirtyDaysAgo } }),
      ]);

      if (env.isDev) {
        console.log("Result:", {
          authentication,
          conversations,
          messages,
          profiles,
        });
      }
    } catch (error: any) {
      console.log(`Error: ${error.message}`);
    } finally {
      console.log(`Schedule: ${new Date().toString()}`);
    }
  },
  null,
  false,
  "Asia/Kolkata"
);

export default job;
