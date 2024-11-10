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

const userSocketMap = new Map<string, Set<string>>();

const getSocketId = (socketUserId: string) => {
  return userSocketMap.get(socketUserId) || new Set<string>();
};

io.on("connection", (socket: Socket) => {
  const userId = socket.handshake.query.userId as string;

  if (userId) {
    if (!userSocketMap.has(userId)) {
      userSocketMap.set(userId, new Set());
    }
    userSocketMap.get(userId)?.add(socket.id);
    console.log(`UserId ${userId} connected with socketId ${socket.id}`);
  } else {
    console.log("Cannot get User ID for socket connection!");
  }

  io.emit(
    "getOnlineUsers",
    Array.from(userSocketMap.entries()).reduce((acc, [userId, sockets]) => {
      acc[userId] = Array.from(sockets);
      return acc;
    }, {} as Record<string, string[]>)
  );

  socket.on("startTyping", (userId) => {
    const socketId = getSocketId(userId);

    socket
      .to(Array.from(socketId))
      .emit("displayTyping", { uid: userId, typing: true });
  });

  socket.on("stopTyping", (userId) => {
    const socketId = getSocketId(userId);

    socket
      .to(Array.from(socketId))
      .emit("hideTyping", { uid: userId, typing: false });
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
    io.emit(
      "getOnlineUsers",
      Array.from(userSocketMap.entries()).reduce((acc, [userId, sockets]) => {
        acc[userId] = Array.from(sockets);
        return acc;
      }, {} as Record<string, string[]>)
    );
  });
});

export { io, server, getSocketId };
