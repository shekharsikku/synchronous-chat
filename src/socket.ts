import { Server, Socket } from "socket.io";
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

const userSocketMap = new Map<string, Set<string>>();

const getSocketId = (userId: string) => {
  const userSockets = userSocketMap.get(userId) || new Set<string>();
  return Array.from(userSockets);
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
    "users:online",
    Array.from(userSocketMap.entries()).reduce((acc, [userId, sockets]) => {
      acc[userId] = Array.from(sockets);
      return acc;
    }, {} as Record<string, string[]>)
  );

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
    io.emit(
      "users:online",
      Array.from(userSocketMap.entries()).reduce((acc, [userId, sockets]) => {
        acc[userId] = Array.from(sockets);
        return acc;
      }, {} as Record<string, string[]>)
    );
  });
});

export { io, server, getSocketId };
