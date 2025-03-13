"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_1 = require("./socket");
const mongodb_1 = __importDefault(require("./mongodb"));
const cron_1 = __importDefault(require("./utils/cron"));
const env_1 = __importDefault(require("./utils/env"));
const uri = env_1.default.MONGODB_URI;
const port = env_1.default.PORT;
(async () => {
    try {
        const state = await (0, mongodb_1.default)(uri);
        if (state === 1) {
            console.log("\nDatabase connection success!");
            cron_1.default.start();
            socket_1.server.listen(port, () => {
                console.log(`Server running on port: ${port}\n`);
            });
        }
        else {
            throw new Error("Database connection error!");
        }
    }
    catch (error) {
        console.error(`Error: ${error.message}\n`);
        process.exit(1);
    }
})();
