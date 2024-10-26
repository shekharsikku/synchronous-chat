"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSocketId = exports.server = exports.io = void 0;
const socket_io_1 = require("socket.io");
const http_1 = require("http");
const env_1 = __importDefault(require("./utils/env"));
const app_1 = __importDefault(require("./app"));
const server = (0, http_1.createServer)(app_1.default);
exports.server = server;
const io = new socket_io_1.Server(server, {
    cors: {
        origin: env_1.default.CORS_ORIGIN,
        credentials: true,
    },
});
exports.io = io;
const userSocketMap = new Map();
const getSocketId = (socketUserId) => {
    return userSocketMap.get(socketUserId);
};
exports.getSocketId = getSocketId;
io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) {
        userSocketMap.set(userId, socket.id);
        console.log(`UserId ${userId} connected with socketId ${socket.id}`);
    }
    else {
        console.log("Cannot get User ID for socket connection!");
    }
    io.emit("getOnlineUsers", Object.fromEntries(userSocketMap.entries()));
    socket.on("messageDelete", (currentMessage) => {
        io.emit("messageRemove", currentMessage);
    });
    socket.on("startTyping", (userId) => {
        const socketId = getSocketId(userId);
        if (socketId) {
            socket.to(socketId).emit("displayTyping", { uid: userId, typing: true });
        }
    });
    socket.on("stopTyping", (userId) => {
        const socketId = getSocketId(userId);
        if (socketId) {
            socket.to(socketId).emit("hideTyping", { uid: userId, typing: false });
        }
    });
    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
        for (const [userId, socketId] of userSocketMap.entries()) {
            if (socketId === socket.id) {
                userSocketMap.delete(userId);
                break;
            }
        }
        io.emit("getOnlineUsers", Object.fromEntries(userSocketMap.entries()));
    });
});
