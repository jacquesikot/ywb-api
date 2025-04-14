import { model, Schema, Types } from 'mongoose';

export const DOCUMENT_NAME = 'KYC';
export const COLLECTION_NAME = 'kyc';

export default interface KYC {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  taxIdentificationNumber: string;
  businessAddress?: string;
  businessLocation?: string;
  certificateOfIncorporation?: string;
  businessLicence?: string;
  proofOfAddress: string;
  ownershipAndControlInformation?: string;
  governmentIssuedId?: string;
  approved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<KYC>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    taxIdentificationNumber: {
      type: Schema.Types.String,
      required: true,
      trim: true,
    },
    businessAddress: {
      type: Schema.Types.String,
      trim: true,
    },
    businessLocation: {
      type: Schema.Types.String,
      trim: true,
    },
    certificateOfIncorporation: {
      type: Schema.Types.String,
      trim: true,
    },
    businessLicence: {
      type: Schema.Types.String,
      trim: true,
    },
    proofOfAddress: {
      type: Schema.Types.String,
      required: true,
      trim: true,
    },
    ownershipAndControlInformation: {
      type: Schema.Types.String,
      trim: true,
    },
    governmentIssuedId: {
      type: Schema.Types.String,
      trim: true,
    },
    approved: {
      type: Schema.Types.Boolean,
      default: false,
    },
    createdAt: {
      type: Schema.Types.Date,
      required: true,
    },
    updatedAt: {
      type: Schema.Types.Date,
      required: true,
    },
  },
  {
    versionKey: false,
  },
);

schema.index({ user: 1 }, { unique: true });
schema.index({ approved: 1 });
schema.index({ createdAt: 1 });

export const KYCModel = model<KYC>(DOCUMENT_NAME, schema, COLLECTION_NAME);
