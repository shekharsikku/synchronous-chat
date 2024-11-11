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
    return userSocketMap.get(socketUserId) || new Set();
};
exports.getSocketId = getSocketId;
io.on("connection", (socket) => {
    var _a;
    const userId = socket.handshake.query.userId;
    if (userId) {
        if (!userSocketMap.has(userId)) {
            userSocketMap.set(userId, new Set());
        }
        (_a = userSocketMap.get(userId)) === null || _a === void 0 ? void 0 : _a.add(socket.id);
        console.log(`UserId ${userId} connected with socketId ${socket.id}`);
    }
    else {
        console.log("Cannot get User ID for socket connection!");
    }
    io.emit("get-online-users", Array.from(userSocketMap.entries()).reduce((acc, [userId, sockets]) => {
        acc[userId] = Array.from(sockets);
        return acc;
    }, {}));
    socket.on("before:contact-select", ({ selectedUser, currentUser }) => {
        const socketId = getSocketId(selectedUser._id);
        io.to(Array.from(socketId)).emit("after:contact-select", {
            selectedUser,
            currentUser,
        });
    });
    socket.on("start-typing", (userId) => {
        const socketId = getSocketId(userId);
        socket
            .to(Array.from(socketId))
            .emit("display-typing", { uid: userId, typing: true });
    });
    socket.on("stop-typing", (userId) => {
        const socketId = getSocketId(userId);
        socket
            .to(Array.from(socketId))
            .emit("hide-typing", { uid: userId, typing: false });
    });
    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
        for (const [userId, sockets] of userSocketMap.entries()) {
            if (sockets.has(socket.id)) {
                sockets.delete(socket.id);
                if (sockets.size === 0) {
                    userSocketMap.delete(userId);
                }
                break;
            }
        }
        io.emit("get-online-users", Array.from(userSocketMap.entries()).reduce((acc, [userId, sockets]) => {
            acc[userId] = Array.from(sockets);
            return acc;
        }, {}));
    });
});
