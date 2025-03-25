import { model, Schema, Types } from 'mongoose';

export const DOCUMENT_NAME = 'Skill';
export const COLLECTION_NAME = 'skills';

export default interface Skill {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const schema = new Schema<Skill>(
  {
    name: {
      type: Schema.Types.String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: Schema.Types.String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: Schema.Types.String,
      default: '',
    },
    createdAt: {
      type: Schema.Types.Date,
      required: true,
      default: Date.now,
    },
    updatedAt: {
      type: Schema.Types.Date,
      required: true,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  },
);

export const SkillModel = model<Skill>(DOCUMENT_NAME, schema, COLLECTION_NAME);
