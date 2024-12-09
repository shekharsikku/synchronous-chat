import { CronJob } from "cron";
import Conversation from "../models/conversation";
import Message from "../models/message";
import User from "../models/user";
import env from "./env";

const job = new CronJob(
  "0 0 * * * *",
  async () => {
    try {
      /** for delete expired auth tokens */
      const currentDate = new Date();

      const authenticationResult = await User.updateMany(
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

      /** for delete conversation that not interacted for 7 days*/
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const conversationResult = await Conversation.deleteMany({
        interaction: { $lt: sevenDaysAgo },
      });

      if (env.isDev) {
        console.log("Result:", {
          authentication: authenticationResult,
          conversations: conversationResult,
          messages: messageResult,
        });
      }
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
