"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cron_1 = require("cron");
const conversation_1 = __importDefault(require("../models/conversation"));
const message_1 = __importDefault(require("../models/message"));
const user_1 = __importDefault(require("../models/user"));
const env_1 = __importDefault(require("./env"));
const job = new cron_1.CronJob("0 0 * * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        /** for delete expired auth tokens */
        const currentDate = new Date();
        const authenticationResult = yield user_1.default.updateMany({ "authentication.expiry": { $lt: currentDate } }, {
            $pull: {
                authentication: { expiry: { $lt: currentDate } },
            },
        });
        /** for delete 24 hours old messages */
        const hoursAgo = new Date();
        hoursAgo.setHours(hoursAgo.getHours() - 24);
        const messageResult = yield message_1.default.deleteMany({
            createdAt: { $lt: hoursAgo },
        });
        /** for delete conversation that not interacted for 7 days*/
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const conversationResult = yield conversation_1.default.deleteMany({
            interaction: { $lt: sevenDaysAgo },
        });
        if (env_1.default.isDev) {
            console.log("Result:", {
                authentication: authenticationResult,
                conversations: conversationResult,
                messages: messageResult,
            });
        }
    }
    catch (error) {
        console.log(`Error: ${error.message}`);
    }
    finally {
        console.log(new Date().toString());
    }
}), null, false, "Asia/Kolkata");
exports.default = job;
