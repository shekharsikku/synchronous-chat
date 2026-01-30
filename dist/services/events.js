class EventsService {
    clients = new Map();
    connect(uid, req, res) {
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
        console.log("Event user connected:", uid);
        const heartbeat = setInterval(() => {
            res.write(": ping\n\n");
            res.flush?.();
        }, 60 * 1000);
        req.on("close", () => {
            clearInterval(heartbeat);
            this.clients.delete(uid);
            console.log("Event user disconnected:", uid);
        });
    }
    send(uid, event, data) {
        const client = this.clients.get(uid);
        if (!client) {
            console.log("Event client not found:", uid);
            return;
        }
        client.write(`event: ${event}\n`);
        client.write(`data: ${JSON.stringify(data)}\n\n`);
    }
}
export const eventsService = new EventsService();
export const connectEvents = (req, res) => {
    const uid = req.user?._id;
    if (!uid) {
        console.log("Event user not authenticated!");
        res.sendStatus(401);
        return;
    }
    eventsService.connect(uid.toString(), req, res);
};
