import webpush from "web-push";
import { logger } from "#/middlewares/index.js";
import { Subscription } from "#/models/index.js";
import type { Types } from "mongoose";

interface PushPayload {
  title: string;
  body: string;
}
const STALE_STATUS_CODES = new Set([404, 410]);

export const sendPushNotification = async <T extends PushPayload>(userId: Types.ObjectId, payload: T) => {
  try {
    const subscriptions = await Subscription.find({ userId }).lean();
    if (subscriptions.length === 0) return;

    const stringified = JSON.stringify(payload);

    const results = await Promise.allSettled(
      subscriptions.map((subscription) => webpush.sendNotification(subscription, stringified))
    );

    const staleEndpoints = results.reduce<string[]>((acc, result, idx) => {
      if (
        result.status === "rejected" &&
        STALE_STATUS_CODES.has(result.reason?.statusCode) &&
        subscriptions[idx]?.endpoint
      ) {
        acc.push(subscriptions[idx].endpoint);
      }
      return acc;
    }, []);

    if (staleEndpoints.length > 0) {
      Subscription.deleteMany({ endpoint: { $in: staleEndpoints } }).catch(() => {});
    }

    const delivered = results.filter((res) => res.status === "fulfilled").length;
    const stats = { delivered, failed: results.length - delivered, stale: staleEndpoints.length };

    logger.info({ stats }, "Push notifications result!");
  } catch (err) {
    logger.error({ err }, "Push notification error!");
  }
};
