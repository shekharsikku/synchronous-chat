import { Subscription } from "#/models/index.js";
import { asyncHandler, HttpError, HttpResponse } from "#/utilities/response.js";
import type { Subscribe, Unsubscribe } from "#/utilities/schema.js";

export const subscribePush = asyncHandler<{}, {}, Subscribe>(async (req, res) => {
  const userId = req.user?._id!;
  const { endpoint, keys } = req.body;

  const result = await Subscription.findOneAndUpdate(
    { userId, endpoint },
    { $set: { keys }, $setOnInsert: { userId, endpoint } },
    { upsert: true, returnDocument: "after" }
  );

  return HttpResponse.success(res, 200, "Subscribed successfully!", result);
});

export const unsubscribePush = asyncHandler<{}, {}, Unsubscribe>(async (req, res) => {
  const userId = req.user?._id!;
  const { endpoint } = req.body;

  const result = await Subscription.findOneAndDelete({ userId, endpoint });

  if (!result) {
    throw new HttpError(404, "No subscription found!");
  }

  return HttpResponse.success(res, 200, "Unsubscribed successfully!", result);
});
