import { Types } from 'mongoose';
import UserWave, { UserWaveModel } from '../model/UserWave';

async function findByUserId(userId: Types.ObjectId): Promise<UserWave | null> {
  return UserWaveModel.findOne({ userId }).lean().exec();
}

async function create(userId: Types.ObjectId): Promise<UserWave> {
  const now = new Date();
  const userWave = await UserWaveModel.create({
    userId,
    availableWaves: 20,
    lastRefillDate: now,
  });
  return userWave.toObject();
}

async function decrementWave(userId: Types.ObjectId): Promise<UserWave | null> {
  return UserWaveModel.findOneAndUpdate(
    { userId },
    { $inc: { availableWaves: -1 } },
    { new: true },
  )
    .lean()
    .exec();
}

async function refillWaves(userId: Types.ObjectId): Promise<UserWave> {
  const now = new Date();
  const result = await UserWaveModel.findOneAndUpdate(
    { userId },
    { availableWaves: 20, lastRefillDate: now },
    { new: true },
  )
    .lean()
    .exec();

  if (!result) {
    return create(userId);
  }

  return result;
}

async function getOrCreate(userId: Types.ObjectId): Promise<UserWave> {
  let userWave = await findByUserId(userId);

  if (!userWave) {
    userWave = await create(userId);
  } else {
    // Check if it's time to refill waves (30 days since last refill)
    const now = new Date();
    const lastRefill = new Date(userWave.lastRefillDate);
    const daysSinceLastRefill = Math.floor(
      (now.getTime() - lastRefill.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSinceLastRefill >= 30) {
      const refilled = await refillWaves(userId);
      userWave = refilled;
    }
  }

  return userWave;
}

export default {
  findByUserId,
  create,
  decrementWave,
  refillWaves,
  getOrCreate,
};
