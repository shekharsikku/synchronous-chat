import { createServer } from "node:http";
import { parseCookie } from "cookie";
import { Server } from "socket.io";
import { parseToken } from "#/controllers/auth.js";
import { logger } from "#/middlewares/index.js";
import { verifyKeyPair } from "#/utilities/crypto.js";
import env from "#/utilities/env.js";
import app from "#/app.js";

const server = createServer(app);

const io = new Server(server, {
  cors: { origin: env.CORS_ORIGIN, credentials: true },
});

const socketMap = new Map<string, Set<string>>();

const getClients = () =>
  Array.from(socketMap.entries()).reduce(
    (acc, [user, sockets]) => {
      acc[user] = Array.from(sockets);
      return acc;
    },
    {} as Record<string, string[]>
  );

const hasSocket = (uid: string, sid: string) => {
  return socketMap.get(uid)?.has(sid) ?? false;
};

export const getSockets = (uid: string) => {
  const sockets = socketMap.get(uid) || new Set<string>();
  return Array.from(sockets);
};

export const emitEvent = (sockets: string[], event: string, payload: any) => {
  if (!sockets.length) return;
  io.to(sockets).emit(event, payload);
};

io.use((socket, next) => {
  const { address: ip, auth, headers, query } = socket.handshake;
  const uid = query["uid"] as string;

  try {
    if (!verifyKeyPair(auth["pk"])) {
      throw new Error("Invalid socket public key!");
    }

    const token = parseCookie(headers.cookie ?? "")?.["current"];

    if (!token) {
      throw new Error("Missing current auth token!");
    }

    const { userId } = parseToken(token);

    if (!userId.equals(uid)) {
      throw new Error("Socket client uid mismatch!");
    }

    socket.data.userId = userId.toString();
    return next();
  } catch (err) {
    logger.error({ err, ip, uid }, "Socket authentication failed!");
    return next(new Error("Unauthorized socket!"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.data.userId as string;

  if (userId) {
    if (!socketMap.has(userId)) {
      socketMap.set(userId, new Set());
    }
    socketMap.get(userId)?.add(socket.id);
    logger.info("User connected: %s:%s", userId, socket.id);
  } else {
    logger.info("Socket disconnected missing userId: %s", socket.id);
    socket.disconnect();
  }

  io.emit("users:online", getClients());

  socket.on("typing:update", ({ selected, current, typing }) => {
    const sockets = getSockets(selected);
    emitEvent(sockets, "typing:update", { selected, current, typing });
  });

  socket.on("call:request", ({ target, details, type }) => {
    const socket = getSockets(target).at(-1);
    if (socket) emitEvent([socket], "call:request", { details, type });
  });

  socket.on("call:response", ({ target, details, action }) => {
    if (!hasSocket(target.uid, target.sid)) {
      socket.emit("target:invalid", { code: "TARGET_INVALID" });
      return;
    }
    emitEvent([target.sid], "call:response", { details, action });
  });

  socket.on("call:ended", ({ target, details }) => {
    if (!hasSocket(target.uid, target.sid)) {
      socket.emit("target:invalid", { code: "TARGET_INVALID" });
      return;
    }
    emitEvent([target.sid], "call:ended", { details });
  });

  socket.on("call:mute", ({ target, mute }) => {
    if (!hasSocket(target?.uid, target?.sid)) {
      socket.emit("target:invalid", { code: "TARGET_INVALID" });
      return;
    }
    emitEvent([target.sid], "call:mute", { mute });
  });

  socket.on("share:request", ({ target, details, file }) => {
    const socket = getSockets(target).at(-1);
    if (socket) emitEvent([socket], "share:request", { details, file });
  });

  socket.on("file:request", ({ target, details, action }) => {
    if (!hasSocket(target.uid, target.sid)) {
      socket.emit("target:invalid", { code: "TARGET_INVALID" });
      return;
    }
    emitEvent([target.sid], "file:request", { details, action });
  });

  socket.on("group:update", ({ group, members }) => {
    const sockets = members
      .filter((member: string) => member !== group.admin)
      .flatMap((uid: string) => getSockets(uid))
      .filter(Boolean);
    emitEvent(sockets, "group:update", group);
  });

  socket.on("disconnect", () => {
    for (const [uid, sockets] of socketMap.entries()) {
      if (sockets.has(socket.id)) {
        logger.info("User disconnected: %s:%s", uid, socket.id);
        sockets.delete(socket.id);
        if (sockets.size === 0) socketMap.delete(uid);
        break;
      }
    }
    io.emit("users:online", getClients());
  });
});

export default server;
