import { Server, Socket } from "socket.io";
import { createServer } from "http";
import env from "./utils/env";
import app from "./app";

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: env.CORS_ORIGIN,
    credentials: true,
  },
});

const userSocketMap = new Map<string, string>();

const getSocketId = (socketUserId: any) => {
  return userSocketMap.get(socketUserId);
};

io.on("connection", (socket: Socket) => {
  const userId = socket.handshake.query.userId as string;

  if (userId) {
    userSocketMap.set(userId, socket.id);
    console.log(`UserId ${userId} connected with socketId ${socket.id}`);
  } else {
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

export { io, server, getSocketId };
