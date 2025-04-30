import { Schema, model, Types } from 'mongoose';

export const DOCUMENT_NAME = 'Proposal';
export const COLLECTION_NAME = 'proposals';

export enum ProposalStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
}

export enum PricingMode {
  FIXED = 'fixed',
  HOURLY = 'hourly',
}

export default interface Proposal {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  job: Types.ObjectId;
  pricingMode: string;
  amount: number;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const schema = new Schema<Proposal>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    job: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    pricingMode: {
      type: String,
      required: true,
      enum: Object.values(PricingMode),
    },
    amount: { type: Number, required: true },
    status: {
      type: String,
      required: true,
      enum: Object.values(ProposalStatus),
      default: ProposalStatus.PENDING,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const ProposalModel = model<Proposal>(
  DOCUMENT_NAME,
  schema,
  COLLECTION_NAME,
);
