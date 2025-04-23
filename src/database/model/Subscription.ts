import { model, Schema, Types } from 'mongoose';
import User from './User';

export const DOCUMENT_NAME = 'Subscription';
export const COLLECTION_NAME = 'subscriptions';

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  PENDING = 'PENDING',
}

export enum SubscriptionPlan {
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

export enum SubscriptionInterval {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export default interface Subscription {
  _id: Types.ObjectId;
  userId: User['_id'];
  plan: SubscriptionPlan;
  interval: SubscriptionInterval;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  // Normally this would come from a payment provider
  price: number;
  autoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<Subscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    plan: {
      type: Schema.Types.String,
      enum: Object.values(SubscriptionPlan),
      required: true,
    },
    interval: {
      type: Schema.Types.String,
      enum: Object.values(SubscriptionInterval),
      required: true,
    },
    status: {
      type: Schema.Types.String,
      enum: Object.values(SubscriptionStatus),
      default: SubscriptionStatus.ACTIVE,
    },
    startDate: {
      type: Schema.Types.Date,
      required: true,
    },
    endDate: {
      type: Schema.Types.Date,
      required: true,
    },
    price: {
      type: Schema.Types.Number,
      required: true,
    },
    autoRenew: {
      type: Schema.Types.Boolean,
      default: true,
    },
    createdAt: {
      type: Schema.Types.Date,
      required: true,
      select: false,
    },
    updatedAt: {
      type: Schema.Types.Date,
      required: true,
      select: false,
    },
  },
  {
    versionKey: false,
  },
);

schema.index({ userId: 1 });
schema.index({ status: 1 });
schema.index({ plan: 1 });
schema.index({ endDate: 1 });

export const SubscriptionModel = model<Subscription>(
  DOCUMENT_NAME,
  schema,
  COLLECTION_NAME,
);
