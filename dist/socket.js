import { Server } from "socket.io";
import { createServer } from "http";
import env from "./utils/env.js";
import app from "./app.js";
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: env.CORS_ORIGIN,
        credentials: true,
    },
});
const userSocketMap = new Map();
const getSocketId = (userId) => {
    const userSockets = userSocketMap.get(userId) || new Set();
    return Array.from(userSockets);
};
io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) {
        if (!userSocketMap.has(userId)) {
            userSocketMap.set(userId, new Set());
        }
        userSocketMap.get(userId)?.add(socket.id);
        console.log(`User connected: ${userId}:${socket.id}`);
    }
    else {
        console.log(`Socket disconnected missing userId:${socket.id}`);
        socket.disconnect();
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
        for (const [userId, sockets] of userSocketMap.entries()) {
            if (sockets.has(socket.id)) {
                console.log(`User disconnected: ${userId}:${socket.id}`);
                sockets.delete(socket.id);
                if (sockets.size === 0)
                    userSocketMap.delete(userId);
                break;
            }
        }
        io.emit("users:online", Array.from(userSocketMap.entries()).reduce((acc, [userId, sockets]) => {
            acc[userId] = Array.from(sockets);
            return acc;
        }, {}));
    });
});
export { io, server, getSocketId };
