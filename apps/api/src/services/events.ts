import type { Request, Response } from "express";
import logger from "#/configs/logger.js";

class EventsService {
  private clients = new Map<string, Set<Response>>();

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

    let clients = this.clients.get(uid);

    if (!clients) {
      clients = new Set();
      this.clients.set(uid, clients);
    }

    clients.add(res);
    logger.info("Event user connected: %s", uid);

    const heartbeat = setInterval(() => {
      res.write(": ping\n\n");
      res.flush?.();
    }, 60 * 1000);

    req.on("close", () => {
      clearInterval(heartbeat);
      clients.delete(res);

      if (clients!.size === 0) {
        this.clients.delete(uid);
      }

      logger.info("Event user disconnected: %s", uid);
    });
  }

  send(uid: string, event: string, data: any) {
    const clients = this.clients.get(uid);

    if (!clients) {
      logger.info("Event clients not found: %s", uid);
      return;
    }

    const message = `event: ${event}\n` + `data: ${JSON.stringify(data)}\n\n`;

    for (const client of clients) {
      client.write(message);
    }
  }
}

export const eventsService = new EventsService();

export const connectEvents = (req: Request, res: Response) => {
  const uid = req.user;

  if (!uid) {
    logger.info("Event user not authenticated!");
    res.sendStatus(401);
    return;
  }

  eventsService.connect(uid, req, res);
};
