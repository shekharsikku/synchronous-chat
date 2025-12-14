import { CronJob } from "cron";
import { User, Message } from "../models/index.js";
import env from "../utils/env.js";

const jobs = new CronJob(
  "0 0 0 * * *",
  async () => {
    try {
      const calculatePastDate = (daysAgo: number) => {
        const taskDate = new Date();
        taskDate.setDate(taskDate.getDate() - daysAgo);
        return taskDate;
      };

      const currentDate = new Date();
      const profileSetupExpiry = calculatePastDate(30);
      const messagesExpiryDate = calculatePastDate(60);

      const [authentication, profiles, messages] = await Promise.all([
        User.updateMany(
          { "authentication.expiry": { $lt: currentDate } },
          { $pull: { authentication: { expiry: { $lt: currentDate } } } }
        ),
        User.deleteMany({ setup: false, createdAt: { $lt: profileSetupExpiry } }),
        Message.deleteMany({ createdAt: { $lt: messagesExpiryDate } }),
      ]);

      if (env.isDev) {
        console.log("Result:", {
          authentication,
          profiles,
          messages,
        });
      }
    } catch (error: any) {
      console.log(`Error: ${error.message}`);
    } finally {
      console.log(`Schedule: ${new Date().toISOString()}`);
    }
  },
  null,
  false,
  "Asia/Kolkata"
);

export default jobs;
