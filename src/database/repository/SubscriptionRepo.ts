import { Types } from 'mongoose';
import Subscription, {
  SubscriptionModel,
  SubscriptionStatus,
} from '../model/Subscription';

class SubscriptionRepo {
  private static SUBSCRIPTION_FIELDS = [
    '_id',
    'userId',
    'plan',
    'interval',
    'status',
    'startDate',
    'endDate',
    'price',
    'autoRenew',
    'createdAt',
    'updatedAt',
  ];

  public static async create(
    subscription: Subscription,
  ): Promise<Subscription> {
    const now = new Date();
    subscription.createdAt = now;
    subscription.updatedAt = now;
    const created = await SubscriptionModel.create(subscription);
    return created.toObject();
  }

  public static async findById(
    id: Types.ObjectId,
  ): Promise<Subscription | null> {
    return SubscriptionModel.findOne({ _id: id })
      .select(this.SUBSCRIPTION_FIELDS)
      .lean()
      .exec();
  }

  public static async findByIdAndUserId(
    id: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<Subscription | null> {
    return SubscriptionModel.findOne({ _id: id, userId })
      .select(this.SUBSCRIPTION_FIELDS)
      .lean()
      .exec();
  }

  public static async findActiveByUserId(
    userId: Types.ObjectId,
  ): Promise<Subscription | null> {
    return SubscriptionModel.findOne({
      userId,
      status: SubscriptionStatus.ACTIVE,
    })
      .select(this.SUBSCRIPTION_FIELDS)
      .lean()
      .exec();
  }

  public static async findAllByUserId(
    userId: Types.ObjectId,
  ): Promise<Subscription[]> {
    return SubscriptionModel.find({ userId })
      .select(this.SUBSCRIPTION_FIELDS)
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  public static async update(
    subscription: Subscription,
  ): Promise<Subscription | null> {
    subscription.updatedAt = new Date();
    return SubscriptionModel.findByIdAndUpdate(subscription._id, subscription, {
      new: true,
    })
      .select(this.SUBSCRIPTION_FIELDS)
      .lean()
      .exec();
  }

  public static async cancelSubscription(
    subscriptionId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<Subscription | null> {
    const subscription = await this.findByIdAndUserId(subscriptionId, userId);
    if (!subscription) return null;

    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.updatedAt = new Date();

    return SubscriptionModel.findByIdAndUpdate(subscriptionId, subscription, {
      new: true,
    })
      .select(this.SUBSCRIPTION_FIELDS)
      .lean()
      .exec();
  }
}

export default SubscriptionRepo;
