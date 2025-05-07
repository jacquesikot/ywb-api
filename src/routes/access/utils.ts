import User from '../../database/model/User';
import _ from 'lodash';
import UserWaveRepo from '../../database/repository/UserWaveRepo';

export const enum AccessMode {
  LOGIN = 'LOGIN',
  SIGNUP = 'SIGNUP',
}

export async function getUserData(user: User) {
  const fields = [
    '_id',
    'name',
    'role',
    'email',
    'profilePicUrl',
    'businessType',
    'bio',
  ];

  const data = _.pick(user, fields);

  // Get user wave information
  const userWave = await UserWaveRepo.getOrCreate(user._id);
  const lastRefill = new Date(userWave.lastRefillDate);
  const now = new Date();
  const daysSinceLastRefill = Math.floor(
    (now.getTime() - lastRefill.getTime()) / (1000 * 60 * 60 * 24),
  );
  const daysUntilNextRefill = Math.max(0, 30 - daysSinceLastRefill);

  const nextRefillDate = new Date(lastRefill);
  nextRefillDate.setDate(nextRefillDate.getDate() + 30);

  return {
    ...data,
    waves: {
      available: userWave.availableWaves,
      totalPerMonth: 20,
      nextRefillDate,
      daysUntilNextRefill,
    },
  };
}
