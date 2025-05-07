import { Schema, model, Types } from 'mongoose';

export const DOCUMENT_NAME = 'UserWave';
export const COLLECTION_NAME = 'userwaves';

/**
 * UserWave model tracks the number of available waves for each user
 *
 * Each user receives 20 waves per month (30 days) to use for job applications
 * When a user waves at a job, it consumes one wave from their available waves
 * Waves are automatically refilled after 30 days from the last refill
 */
export default interface UserWave {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  availableWaves: number;
  lastRefillDate: Date;
}

const schema = new Schema<UserWave>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    availableWaves: {
      type: Schema.Types.Number,
      default: 20,
      min: 0,
      required: true,
    },
    lastRefillDate: {
      type: Schema.Types.Date,
      default: Date.now,
      required: true,
    },
  },
  {
    versionKey: false,
  },
);

schema.index({ userId: 1 }, { unique: true });

export const UserWaveModel = model<UserWave>(
  DOCUMENT_NAME,
  schema,
  COLLECTION_NAME,
);
