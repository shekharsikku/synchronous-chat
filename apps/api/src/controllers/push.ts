import { requireUserId } from "#/controllers/user.js";
import { Subscription } from "#/models/index.js";
import { asyncHandler, HttpResponse } from "#/utilities/response.js";
import type { Subscribe, Unsubscribe } from "#/utilities/schema.js";

export const subscribePush = asyncHandler<{}, {}, Subscribe>(async (req, res) => {
  const userId = requireUserId(req);
  const { endpoint, keys } = req.body;

  await Subscription.updateOne(
    { userId, endpoint },
    { $set: { keys }, $setOnInsert: { userId, endpoint } },
    { upsert: true }
  );

  return HttpResponse.success(res, 200, "Subscribed successfully!");
});

export const unsubscribePush = asyncHandler<{}, {}, Unsubscribe>(async (req, res) => {
  const userId = requireUserId(req);
  const { endpoint } = req.body;

  await Subscription.deleteOne({ userId, endpoint });

  return HttpResponse.success(res, 200, "Unsubscribed successfully!");
});
