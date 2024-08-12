"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSocketId = exports.server = exports.io = exports.userSocketMap = void 0;
const socket_io_1 = require("socket.io");
const http_1 = require("http");
const env_1 = __importDefault(require("./utils/env"));
const app_1 = __importDefault(require("./app"));
const server = (0, http_1.createServer)(app_1.default);
exports.server = server;
const allowedOrigins = env_1.default.CORS_ORIGIN;
const origins = allowedOrigins.split(",");
const allowedMethods = env_1.default.ALLOWED_METHODS;
const methods = allowedMethods.split(",");
const io = new socket_io_1.Server(server, {
    cors: {
        origin: origins,
        methods: methods,
        credentials: true,
    },
});
exports.io = io;
exports.userSocketMap = new Map();
const getSocketId = (userSocketId) => {
    return exports.userSocketMap.get(userSocketId);
};
exports.getSocketId = getSocketId;
io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) {
        exports.userSocketMap.set(userId, socket.id);
        console.log(`UserId ${userId} connected with socketId ${socket.id}`);
    }
    else {
        console.log("Cannot get User ID for socket connection!");
    }
    io.emit("getOnlineUsers", Object.fromEntries(exports.userSocketMap.entries()));
    socket.on("messageDelete", (currentMessage) => {
        io.emit("messageRemove", currentMessage);
    });
    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
        for (const [userId, socketId] of exports.userSocketMap.entries()) {
            if (socketId === socket.id) {
                exports.userSocketMap.delete(userId);
                break;
            }
        }
        io.emit("getOnlineUsers", Object.fromEntries(exports.userSocketMap.entries()));
    });
});
