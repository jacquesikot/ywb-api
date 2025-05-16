import { Schema, model, Types } from 'mongoose';

export const DOCUMENT_NAME = 'Certificate';
export const COLLECTION_NAME = 'certificates';

export default interface Certificate {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  name: string;
  issuedBy: string;
  website?: string;
  yearIssued: string;
  expiration?: string;
}

const schema = new Schema<Certificate>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    issuedBy: { type: String, required: true },
    website: { type: String },
    yearIssued: { type: String, required: true },
    expiration: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Index for faster lookups
schema.index({ user: 1 });
schema.index({ user: 1, issuedBy: 1 });

export const CertificateModel = model<Certificate>(
  DOCUMENT_NAME,
  schema,
  COLLECTION_NAME,
);
