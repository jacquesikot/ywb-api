import { UserModel } from '../database/model/User';
import { UserWaveModel } from '../database/model/UserWave';
import Logger from '../core/Logger';

/**
 * Monthly job to check and refill user waves
 * This should be scheduled to run daily, but it will only refill waves
 * for users who haven't had a refill in 30 days or more
 */
export default async function refillUserWaves(): Promise<void> {
  try {
    Logger.info('Starting monthly wave refill check job');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Find all user waves records that haven't been refilled in 30 days
    const userWavesToRefill = await UserWaveModel.find({
      lastRefillDate: { $lte: thirtyDaysAgo },
    });

    Logger.info(`Found ${userWavesToRefill.length} users to refill waves for`);

    if (userWavesToRefill.length === 0) {
      return;
    }

    // Refill waves for all eligible users
    const now = new Date();
    const bulkOps = userWavesToRefill.map((userWave) => ({
      updateOne: {
        filter: { _id: userWave._id },
        update: { $set: { availableWaves: 20, lastRefillDate: now } },
      },
    }));

    const result = await UserWaveModel.bulkWrite(bulkOps);
    Logger.info(`Refilled waves for ${result.modifiedCount} users`);
  } catch (error) {
    Logger.error('Error in refillUserWaves job', error);
  }
}
