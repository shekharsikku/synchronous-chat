import { Server, Socket } from "socket.io";
import { createServer } from "http";
import env from "./utils/env";
import app from "./app";

const server = createServer(app);

const corsOrigin = env.CORS_ORIGIN;

const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    credentials: true,
  },
});

export const userSocketMap = new Map<string, string>();

const getSocketId = (userSocketId: any) => {
  return userSocketMap.get(userSocketId);
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
