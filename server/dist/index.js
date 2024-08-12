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
const socket_1 = require("./socket");
const mongodb_1 = __importDefault(require("./mongodb"));
const env_1 = __importDefault(require("./utils/env"));
const uri = env_1.default.MONGODB_URI;
const port = env_1.default.PORT;
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const state = yield (0, mongodb_1.default)(uri);
        if (state == 1) {
            socket_1.server.listen(port, () => {
                console.log(`🚀 Server running on port: ${port}\n`);
            });
        }
        else {
            throw new Error("Invalid connection state!");
        }
    }
    catch (error) {
        console.error(`Error: ${error.message}\n`);
        process.exit(1);
    }
}))();
