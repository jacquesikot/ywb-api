import { Schema, model, Types } from 'mongoose';

export const DOCUMENT_NAME = 'Project';
export const COLLECTION_NAME = 'projects';

export default interface Project {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  title: string;
  description: string;
  tags: string[];
  thumbnail?: string;
  images?: string[];
}

const schema = new Schema<Project>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    tags: { type: [String], required: true },
    thumbnail: { type: String },
    images: { type: [String] },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const ProjectModel = model<Project>(DOCUMENT_NAME, schema, COLLECTION_NAME);
