import { Schema, model, Types } from 'mongoose';

export const DOCUMENT_NAME = 'Wave';
export const COLLECTION_NAME = 'waves';

export enum WaveStatus {
  WAVED = 'waved',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export default interface Wave {
  _id: Types.ObjectId;
  jobId: Types.ObjectId;
  freelancerId: Types.ObjectId;
  status: WaveStatus;
  createdAt?: Date;
}

const schema = new Schema<Wave>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    freelancerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: Schema.Types.String,
      enum: Object.values(WaveStatus),
      default: WaveStatus.WAVED,
      required: true,
    },
    createdAt: {
      type: Schema.Types.Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  },
);

schema.index({ jobId: 1, freelancerId: 1 }, { unique: true });

export const WaveModel = model<Wave>(DOCUMENT_NAME, schema, COLLECTION_NAME);
