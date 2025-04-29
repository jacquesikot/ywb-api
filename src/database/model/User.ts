import { model, Schema, Types } from 'mongoose';
import Role from './Role';
import Skill from './Skill';

export const DOCUMENT_NAME = 'User';
export const COLLECTION_NAME = 'users';
export enum ExperienceLevel {
  JUNIOR = 'JUNIOR',
  MID = 'MID',
  SENIOR = 'SENIOR',
  EXPERT = 'EXPERT',
}
export enum AvailabilityStatus {
  FULLTIME = 'FULLTIME',
  CONTRACT = 'CONTRACT',
  REMOTE = 'REMOTE',
  HYBRID = 'HYBRID',
}
export interface Availability {
  status: AvailabilityStatus;
  hoursPerWeek?: string;
}
export enum PreferredRate {
  HOURLY = 'HOURLY',
  FIXED = 'FIXED',
}
export enum BusinessType {
  BUSINESS = 'BUSINESS',
  PERSONAL = 'PERSONAL',
}
export enum Industry {
  DESIGN = 'DESIGN',
  SOFTWARE = 'SOFTWARE',
  PRODUCT = 'PRODUCT',
  WRITING = 'WRITING',
  MARKETING = 'MARKETING',
  ARCHITECTURE = 'ARCHITECTURE',
  ADMIN = 'ADMIN',
  TECHNOLOGY = 'TECHNOLOGY',
  ENGINEERING = 'ENGINEERING',
  OTHER = 'OTHER',
}
export enum Plan {
  FREE = 'FREE',
  PRO = 'PRO',
}
export enum PlanType {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}
export default interface User {
  _id: Types.ObjectId;
  name: string;
  profilePicUrl?: string;
  email: string;
  password: string;
  phone?: string;
  bio?: string;
  location?: {
    country?: string;
    state?: string;
    city?: string;
    address?: string;
    zipCode?: string;
  };
  role: Role;
  companyRole?: string;
  verified?: boolean;
  status?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  // freelancer details
  skills?: Skill[];
  experienceLevel?: ExperienceLevel;
  portfolioLinks?: string[];
  preferredRate?: { type: PreferredRate; rate: number };
  availability?: Availability;
  // business details
  companyName?: string;
  industry?: Industry;
  website?: string;
  organisationSize?: string;
  // client details
  businessType?: BusinessType;
  talentPoolPreferences?: Skill[];
  // plan details
  plan: Plan;
  planType: PlanType;
}
const schema = new Schema<User>(
  {
    name: {
      type: Schema.Types.String,
      trim: true,
      maxlength: 200,
    },
    phone: {
      type: Schema.Types.String,
      trim: true,
      maxlength: 15,
    },
    profilePicUrl: {
      type: Schema.Types.String,
      trim: true,
    },
    email: {
      type: Schema.Types.String,
      unique: true,
      sparse: true,
      trim: true,
      select: false,
    },
    password: {
      type: Schema.Types.String,
      select: false,
    },
    bio: {
      type: Schema.Types.String,
      select: false,
      trim: true,
      maxlength: 500,
    },
    location: {
      country: {
        type: Schema.Types.String,
        required: false,
      },
      state: {
        type: Schema.Types.String,
        required: false,
      },
      city: {
        type: Schema.Types.String,
        required: false,
      },
      address: {
        type: Schema.Types.String,
        required: false,
      },
      zipCode: {
        type: Schema.Types.String,
        required: false,
      },
    },
    role: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
    },
    companyRole: {
      type: Schema.Types.String,
      maxlength: 200,
    },
    verified: {
      type: Schema.Types.Boolean,
      default: false,
    },
    status: {
      type: Schema.Types.Boolean,
      default: true,
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
    skills: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Skill',
        },
      ],
    },
    experienceLevel: {
      type: Schema.Types.String,
      enum: [ExperienceLevel],
    },
    portfolioLinks: {
      type: [Schema.Types.String],
    },
    preferredRate: {
      type: {
        type: Schema.Types.String,
        enum: [PreferredRate],
      },
      rate: {
        type: Schema.Types.Number,
      },
    },
    availability: {
      status: {
        type: Schema.Types.String,
        enum: [AvailabilityStatus],
      },
      hoursPerWeek: {
        type: Schema.Types.String,
      },
    },
    companyName: {
      type: Schema.Types.String,
    },
    industry: {
      type: Schema.Types.String,
    },
    website: {
      type: Schema.Types.String,
      trim: true,
    },
    organisationSize: {
      type: Schema.Types.String,
      trim: true,
    },
    businessType: {
      type: Schema.Types.String,
      enum: [BusinessType],
    },
    talentPoolPreferences: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Skill',
        },
      ],
    },
    plan: {
      type: Schema.Types.String,
      enum: Object.values(Plan),
      default: Plan.FREE,
    },
    planType: {
      type: Schema.Types.String,
      enum: Object.values(PlanType),
      default: PlanType.MONTHLY,
    },
  },
  {
    versionKey: false,
  },
);

schema.index({ _id: 1, status: 1 });
schema.index({ phone: 1 }, { unique: true, sparse: true });
schema.index({ skills: 1 });
schema.index({ experienceLevel: 1 });
schema.index({ availability: 1 });
schema.index({ industry: 1 });
schema.index({ businessType: 1 });
schema.index({ talentPoolPreferences: 1 });
export const UserModel = model<User>(DOCUMENT_NAME, schema, COLLECTION_NAME);
