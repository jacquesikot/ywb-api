import { Schema, model, Types } from 'mongoose';

export const DOCUMENT_NAME = 'Chat';
export const COLLECTION_NAME = 'chats';

export default interface Chat {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  members: Types.ObjectId[];
  jobId?: Types.ObjectId;
  waveId?: Types.ObjectId;
  createdAt: Date;
}

const schema = new Schema<Chat>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      required: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: false,
    },
    waveId: {
      type: Schema.Types.ObjectId,
      ref: 'Wave',
      required: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  },
);

// Drop the old index if it exists
schema.index({ ownerId: 1, members: 1 }, { unique: false });

// Create a new compound index that includes jobId and waveId
schema.index({ ownerId: 1, members: 1, jobId: 1, waveId: 1 }, { unique: true });

export const ChatModel = model<Chat>(DOCUMENT_NAME, schema, COLLECTION_NAME);
