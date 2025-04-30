import { Schema, model, Types } from 'mongoose';

export const DOCUMENT_NAME = 'Milestone';
export const COLLECTION_NAME = 'milestones';

export enum MilestoneStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export default interface Milestone {
  _id: Types.ObjectId;
  name: string;
  description: string;
  deliverables: string[];
  dueDate: Date;
  proposalId: Types.ObjectId;
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const schema = new Schema<Milestone>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    deliverables: { type: [String], required: true },
    dueDate: { type: Date, required: true },
    proposalId: {
      type: Schema.Types.ObjectId,
      ref: 'Proposal',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(MilestoneStatus),
      default: MilestoneStatus.PENDING,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const MilestoneModel = model<Milestone>(
  DOCUMENT_NAME,
  schema,
  COLLECTION_NAME,
);
