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
    "get-online-users",
    Array.from(userSocketMap.entries()).reduce((acc, [userId, sockets]) => {
      acc[userId] = Array.from(sockets);
      return acc;
    }, {} as Record<string, string[]>)
  );

  socket.on("start-typing", ({ selectedUser, currentUser }) => {
    const socketId = getSocketId(selectedUser);

    socket.to(Array.from(socketId)).emit("display-typing", {
      uid: selectedUser,
      cid: currentUser,
      typing: true,
    });
  });

  socket.on("stop-typing", ({ selectedUser, currentUser }) => {
    const socketId = getSocketId(selectedUser);

    socket.to(Array.from(socketId)).emit("hide-typing", {
      uid: selectedUser,
      cid: currentUser,
      typing: false,
    });
  });

  socket.on("before:profile-update", ({ updatedDetails }) => {
    const socketId = getSocketId(updatedDetails._id);

    socket.to(Array.from(socketId)).emit("after:profile-update", {
      updatedDetails,
    });

    // socketId.forEach((id) => {
    //   io.to(id).emit("after:profile-update", { updatedDetails });
    // });
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
      "get-online-users",
      Array.from(userSocketMap.entries()).reduce((acc, [userId, sockets]) => {
        acc[userId] = Array.from(sockets);
        return acc;
      }, {} as Record<string, string[]>)
    );
  });
});

export { io, server, getSocketId };
