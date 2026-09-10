import { CronJob } from "cron";
import logger from "#/configs/logger.js";
import { filesService } from "./files.js";

const jobs = new CronJob(
  "0 0 0 * * *",
  async () => {
    try {
      const dateBefore = new Date();
      dateBefore.setDate(dateBefore.getDate() - 60);

      const result = await filesService.deleteOlder(dateBefore);

      logger.info({ result }, "Cron job result!");
    } catch (err) {
      logger.error({ err }, "Cron job failed!");
    }
  },
  null,
  false,
  "Asia/Kolkata"
);

export default jobs;
