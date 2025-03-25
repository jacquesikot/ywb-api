import { Schema, model, Types } from 'mongoose';
import Skill from './Skill';

export const DOCUMENT_NAME = 'Job';
export const COLLECTION_NAME = 'jobs';

export enum JobStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  IN_PROGRESS = 'IN_PROGRESS',
}

export enum LocationPreference {
  REMOTE = 'REMOTE',
  ONSITE = 'ONSITE',
}

export enum JobType {
  CONTRACT = 'CONTRACT',
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
}

export enum BudgetType {
  FIXED = 'FIXED',
  HOURLY = 'HOURLY',
}

export default interface Job {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  title: string;
  description: string;
  skills: Skill[];
  waves: Types.ObjectId[];
  locationPreference: LocationPreference;
  resource?: {
    figma?: string;
    zeplin?: string;
    invision?: string;
    marvel?: string;
    dropbox?: string;
    googleDrive?: string;
    box?: string;
    github?: string;
    other?: string;
  };
  budget: {
    type: BudgetType;
    value?: number;
    min?: number;
    max?: number;
  };
  hoursPerWeek?: number;
  timeline: string;
  status: JobStatus;
  type: JobType;
  createdAt?: Date;
  updatedAt?: Date;
}

const schema = new Schema<Job>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: Schema.Types.String,
      required: true,
    },
    description: {
      type: Schema.Types.String,
      required: true,
    },
    skills: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Skill',
      },
    ],
    waves: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Wave',
      },
    ],
    locationPreference: {
      type: Schema.Types.String,
      enum: Object.values(LocationPreference),
      required: true,
    },
    resource: {
      figma: {
        type: Schema.Types.String,
      },
      zeplin: {
        type: Schema.Types.String,
      },
      invision: {
        type: Schema.Types.String,
      },
      marvel: {
        type: Schema.Types.String,
      },
      dropbox: {
        type: Schema.Types.String,
      },
      googleDrive: {
        type: Schema.Types.String,
      },
      box: {
        type: Schema.Types.String,
      },
      github: {
        type: Schema.Types.String,
      },
      other: {
        type: Schema.Types.String,
      },
    },
    type: {
      type: Schema.Types.String,
      enum: Object.values(JobType),
      required: true,
    },
    budget: {
      type: {
        type: Schema.Types.String,
        enum: Object.values(BudgetType),
        required: true,
      },
      value: {
        type: Schema.Types.Number,
      },
      min: {
        type: Schema.Types.Number,
      },
      max: {
        type: Schema.Types.Number,
      },
    },
    hoursPerWeek: {
      type: Schema.Types.Number,
    },
    timeline: {
      type: Schema.Types.String,
      required: true,
    },
    status: {
      type: Schema.Types.String,
      enum: Object.values(JobStatus),
      default: JobStatus.OPEN,
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

schema.index({ title: 1, status: 1 });

export const JobModel = model<Job>(DOCUMENT_NAME, schema, COLLECTION_NAME);
