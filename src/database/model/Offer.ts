import { Schema, model, Types } from 'mongoose';

export const DOCUMENT_NAME = 'Offer';
export const COLLECTION_NAME = 'offers';

export enum OfferStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
}

export default interface Offer {
  _id: Types.ObjectId;
  job: Types.ObjectId;
  user: Types.ObjectId;
  freelancer: Types.ObjectId;
  status: OfferStatus;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<Offer>(
  {
    job: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    freelancer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: Object.values(OfferStatus),
      default: OfferStatus.PENDING,
      required: true,
    },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  {
    versionKey: false,
  },
);

// Indexes for faster lookups
schema.index({ job: 1 });
schema.index({ user: 1 });
schema.index({ freelancer: 1 });
schema.index({ status: 1 });
schema.index({ freelancer: 1, status: 1 });

export const OfferModel = model<Offer>(DOCUMENT_NAME, schema, COLLECTION_NAME);
