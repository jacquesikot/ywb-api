import { Schema, model, Types } from 'mongoose';

export const DOCUMENT_NAME = 'Education';
export const COLLECTION_NAME = 'educations';

export default interface Education {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  degree: string;
  fieldOfStudy: string;
  institutionName: string;
  location?: string;
  institutionWebsite?: string;
  startYear: number;
  endYear?: number;
  description?: string;
}

const schema = new Schema<Education>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    degree: { type: String, required: true },
    fieldOfStudy: { type: String, required: true },
    institutionName: { type: String, required: true },
    location: { type: String },
    institutionWebsite: { type: String },
    startYear: { type: Number, required: true },
    endYear: { type: Number },
    description: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const EducationModel = model<Education>(DOCUMENT_NAME, schema, COLLECTION_NAME);
