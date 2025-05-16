import { Schema, model, Types } from 'mongoose';

export const DOCUMENT_NAME = 'WorkHistory';
export const COLLECTION_NAME = 'workhistories';

export default interface WorkHistory {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  title: string;
  company: string;
  location?: string;
  website?: string;
  startYear: string;
  endYear?: string;
  currentlyWorkHere: boolean;
  description?: string;
}

const schema = new Schema<WorkHistory>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String },
    website: { type: String },
    startYear: { type: String, required: true },
    endYear: { type: String },
    currentlyWorkHere: { type: Boolean, default: false },
    description: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Index for faster lookups
schema.index({ user: 1 });
schema.index({ user: 1, company: 1 });

export const WorkHistoryModel = model<WorkHistory>(
  DOCUMENT_NAME,
  schema,
  COLLECTION_NAME,
);
