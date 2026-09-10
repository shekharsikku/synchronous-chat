import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { ExpressPeerServer } from "peer";
import app from "#/app.js";
import env from "#/configs/env.js";
import logger from "#/configs/logger.js";
import { HttpResponse } from "#/utilities/response.js";

const server = createServer(app);

server.on("error", (err) => {
  logger.error({ err }, "Server failed to start!");
  process.exit(1);
});

const peerServer = ExpressPeerServer(server, {
  corsOptions: {
    origin: env.CORS_ORIGIN,
    credentials: true,
    maxAge: 86400,
  },
  allow_discovery: env.isDev,
  generateClientId: () => randomBytes(12).toString("hex"),
});

peerServer.on("connection", (client) => {
  logger.info("Peer connected: %s", client.getId());
});

peerServer.on("disconnect", (client) => {
  logger.info("Peer disconnected: %s", client.getId());
});

app.use("/synchronous", peerServer);

app.use((req, res) => {
  return HttpResponse.error(res, 404, `Requested url '${req.url}' no found!`);
});

export default server;
