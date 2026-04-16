import { CronJob } from "cron";
import { logger } from "#/middlewares/index.js";
import { User, Message } from "#/models/index.js";

const calculatePastDate = (daysAgo: number) => {
  const taskDate = new Date();
  taskDate.setDate(taskDate.getDate() - daysAgo);
  return taskDate;
};

const jobs = new CronJob(
  "0 0 0 * * *",
  async () => {
    try {
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

      logger.info({ authentication, profiles, messages }, "Cron job result!");
    } catch (err) {
      logger.error({ err }, "Cron job failed!");
    }
  },
  null,
  false,
  "Asia/Kolkata"
);

export default jobs;
