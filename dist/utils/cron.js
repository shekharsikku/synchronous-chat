"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cron_1 = require("cron");
const conversation_1 = __importDefault(require("../models/conversation"));
const message_1 = __importDefault(require("../models/message"));
const user_1 = __importDefault(require("../models/user"));
const env_1 = __importDefault(require("./env"));
const job = new cron_1.CronJob("0 0 0 * * *", async () => {
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
            user_1.default.updateMany({ "authentication.expiry": { $lt: currentDate } }, { $pull: { authentication: { expiry: { $lt: currentDate } } } }),
            user_1.default.deleteMany({ setup: false, createdAt: { $lt: threeDaysAgo } }),
            message_1.default.deleteMany({ createdAt: { $lt: sevenDaysAgo } }),
            conversation_1.default.deleteMany({ interaction: { $lt: fourteenDaysAgo } }),
        ]);
        if (env_1.default.isDev) {
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
exports.default = job;
