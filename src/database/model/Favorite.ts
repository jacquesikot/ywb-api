import { Schema, model, Types } from 'mongoose';

export const DOCUMENT_NAME = 'Favorite';
export const COLLECTION_NAME = 'favorites';

export default interface Favorite {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  job: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const schema = new Schema<Favorite>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    job: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
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

// Create a compound index for user and job to ensure uniqueness
schema.index({ user: 1, job: 1 }, { unique: true });

export const FavoriteModel = model<Favorite>(
  DOCUMENT_NAME,
  schema,
  COLLECTION_NAME,
);
