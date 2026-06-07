import { Subscription } from "#/models/index.js";
import { asyncHandler, HttpError, HttpResponse } from "#/utils/response.js";
import type { Subscribe, Unsubscribe } from "#/utils/schema.js";

export const subscribe = asyncHandler<{}, {}, Subscribe>(async (req) => {
  const userId = req.user?._id!;
  const { endpoint, keys } = req.body;

  const result = await Subscription.findOneAndUpdate(
    { userId, endpoint },
    { $set: { keys }, $setOnInsert: { userId, endpoint } },
    { upsert: true, returnDocument: "after" }
  );

  return new HttpResponse(200, "Subscribed successfully!", { data: result });
});

export const unsubscribe = asyncHandler<{}, {}, Unsubscribe>(async (req) => {
  const userId = req.user?._id!;
  const { endpoint } = req.body;

  const result = await Subscription.findOneAndDelete({ userId, endpoint });

  if (!result) {
    throw new HttpError(404, "No subscription found with this endpoint!");
  }

  return new HttpResponse(200, "Unsubscribed successfully!", { data: result });
});
