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
    "users:online",
    Array.from(userSocketMap.entries()).reduce((acc, [userId, sockets]) => {
      acc[userId] = Array.from(sockets);
      return acc;
    }, {} as Record<string, string[]>)
  );

  socket.on("typing:start", ({ selectedUser, currentUser }) => {
    const socketId = getSocketId(selectedUser);

    socket.to(Array.from(socketId)).emit("typing:display", {
      uid: selectedUser,
      cid: currentUser,
      typing: true,
    });
  });

  socket.on("typing:stop", ({ selectedUser, currentUser }) => {
    const socketId = getSocketId(selectedUser);

    socket.to(Array.from(socketId)).emit("typing:hide", {
      uid: selectedUser,
      cid: currentUser,
      typing: false,
    });
  });

  socket.on("before:profileupdate", ({ updatedDetails }) => {
    const socketId = getSocketId(updatedDetails._id);

    socket.to(Array.from(socketId)).emit("after:profileupdate", {
      updatedDetails,
    });

    // socketId.forEach((id) => {
    //   io.to(id).emit("after:profileupdate", { updatedDetails });
    // });
  });

  socket.on("before:callrequest", ({ callingDetails }) => {
    const socketId = getSocketId(callingDetails.to);

    socket.to(Array.from(socketId)).emit("after:callrequest", {
      callingDetails,
    });
  });

  socket.on("before:callconnect", ({ callingActions }) => {
    const socketId = getSocketId(callingActions.to);

    socket.to(Array.from(socketId)).emit("after:callconnect", {
      callingActions,
    });
  });

  socket.on("before:calldisconnect", ({ callingActions }) => {
    const socketId = getSocketId(callingActions.to);

    socket.to(Array.from(socketId)).emit("after:calldisconnect", {
      callingActions,
    });
  });

  socket.on("before:micaction", ({ microphoneAction }) => {
    const socketId = getSocketId(microphoneAction.to);

    socket.to(Array.from(socketId)).emit("after:micaction", {
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
