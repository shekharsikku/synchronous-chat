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
const getSocketId = (userId) => {
    const userSockets = userSocketMap.get(userId) || new Set();
    return Array.from(userSockets);
};
exports.getSocketId = getSocketId;
io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) {
        if (!userSocketMap.has(userId)) {
            userSocketMap.set(userId, new Set());
        }
        userSocketMap.get(userId)?.add(socket.id);
        console.log(`UserId ${userId} connected with socketId ${socket.id}`);
    }
    else {
        console.log("Cannot get User ID for socket connection!");
    }
    io.emit("users:online", Array.from(userSocketMap.entries()).reduce((acc, [userId, sockets]) => {
        acc[userId] = Array.from(sockets);
        return acc;
    }, {}));
    socket.on("typing:start", ({ selectedUser, currentUser }) => {
        const socketId = getSocketId(selectedUser);
        socket.to(socketId).emit("typing:display", {
            uid: selectedUser,
            cid: currentUser,
            typing: true,
        });
    });
    socket.on("typing:stop", ({ selectedUser, currentUser }) => {
        const socketId = getSocketId(selectedUser);
        socket.to(socketId).emit("typing:hide", {
            uid: selectedUser,
            cid: currentUser,
            typing: false,
        });
    });
    socket.on("before:profileupdate", ({ updatedDetails }) => {
        const socketId = getSocketId(updatedDetails._id);
        socket.to(socketId).emit("after:profileupdate", {
            updatedDetails,
        });
    });
    socket.on("before:callrequest", ({ callingDetails }) => {
        const socketId = getSocketId(callingDetails.to);
        socket.to(socketId).emit("after:callrequest", {
            callingDetails,
        });
    });
    socket.on("before:callconnect", ({ callingActions }) => {
        const socketId = getSocketId(callingActions.to);
        socket.to(socketId).emit("after:callconnect", {
            callingActions,
        });
    });
    socket.on("before:calldisconnect", ({ callingActions }) => {
        const socketId = getSocketId(callingActions.to);
        socket.to(socketId).emit("after:calldisconnect", {
            callingActions,
        });
    });
    socket.on("before:muteaction", ({ microphoneAction }) => {
        const socketId = getSocketId(microphoneAction.to);
        socket.to(socketId).emit("after:muteaction", {
            microphoneAction,
        });
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
        io.emit("users:online", Array.from(userSocketMap.entries()).reduce((acc, [userId, sockets]) => {
            acc[userId] = Array.from(sockets);
            return acc;
        }, {}));
    });
});
