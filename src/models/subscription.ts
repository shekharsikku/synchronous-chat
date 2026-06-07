import { type InferSchemaType, type HydratedDocument, Schema, model } from "mongoose";

const SubscriptionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    endpoint: {
      type: String,
      required: true,
    },
    keys: {
      _id: false,
      type: {
        p256dh: {
          type: String,
          required: true,
        },
        auth: {
          type: String,
          required: true,
        },
      },
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

SubscriptionSchema.index({ userId: 1, endpoint: 1 }, { unique: true });
SubscriptionSchema.index({ userId: 1 });

export type SubscriptionType = InferSchemaType<typeof SubscriptionSchema>;
export type SubscriptionDocument = HydratedDocument<SubscriptionType>;

const SubscriptionModel = model<SubscriptionType>("Subscription", SubscriptionSchema);
export default SubscriptionModel;
