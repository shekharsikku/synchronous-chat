import type { Request, Response } from "express";
import { logger } from "#/middlewares/index.js";

class EventsService {
  private clients = new Map<string, Response>();

  connect(uid: string, req: Request, res: Response) {
    res.set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "Access-Control-Allow-Credentials": "true",
    });

    res.flushHeaders();
    res.write(": connected\n\n");

    this.clients.set(uid, res);
    logger.info("Event user connected: %s", uid);

    const heartbeat = setInterval(() => {
      res.write(": ping\n\n");
      res.flush?.();
    }, 60 * 1000);

    req.on("close", () => {
      clearInterval(heartbeat);
      this.clients.delete(uid);
      logger.info("Event user disconnected: %s", uid);
    });
  }

  send(uid: string, event: string, data: any) {
    const client = this.clients.get(uid);

    if (!client) {
      logger.info("Event client not found: %s", uid);
      return;
    }

    client.write(`event: ${event}\n`);
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  }
}

export const eventsService = new EventsService();

export const connectEvents = (req: Request, res: Response) => {
  const uid = req.user?._id;

  if (!uid) {
    logger.info("Event user not authenticated!");
    res.sendStatus(401);
    return;
  }

  eventsService.connect(uid.toString(), req, res);
};
