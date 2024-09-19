import { CronJob } from "cron";
import Message from "../models/message";

const job = new CronJob(
  "0 0 * * * *",
  async () => {
    try {
      const hoursAgo = new Date();
      hoursAgo.setHours(hoursAgo.getHours() - 24);

      const result = await Message.deleteMany({
        createdAt: { $lt: hoursAgo },
      });

      console.log("Response:", result);
    } catch (error: any) {
      console.log(`Error: ${error.message}`);
    } finally {
      console.log(new Date().toString());
    }
  },
  null,
  false,
  "Asia/Kolkata"
);

export default job;
