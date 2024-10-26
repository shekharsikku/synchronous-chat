import { CronJob } from "cron";
import User from "../models/user";
import Message from "../models/message";

const job = new CronJob(
  "0 0 * * * *",
  async () => {
    try {
      /** for delete expired auth tokens */
      const currentDate = new Date();

      const authResult = await User.updateMany(
        { "authentication.expiry": { $lt: currentDate } },
        {
          $pull: {
            authentication: { expiry: { $lt: currentDate } },
          },
        }
      );

      /** for delete 24 hours old messages */
      const hoursAgo = new Date();
      hoursAgo.setHours(hoursAgo.getHours() - 24);

      const messageResult = await Message.deleteMany({
        createdAt: { $lt: hoursAgo },
      });

      console.log("Result:", {
        authentication: authResult,
        messages: messageResult,
      });
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
