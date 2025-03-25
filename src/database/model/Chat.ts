import { Schema, model, Types } from 'mongoose';

export const DOCUMENT_NAME = 'Chat';
export const COLLECTION_NAME = 'chats';

export default interface Chat {
  _id: Types.ObjectId;
  users: Types.ObjectId[];
  jobId: Types.ObjectId;
  waveId: Types.ObjectId;
  createdAt: Date;
}

const schema = new Schema<Chat>(
  {
    users: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      required: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    waveId: {
      type: Schema.Types.ObjectId,
      ref: 'Wave',
      required: true,
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

schema.index({ jobId: 1, participants: 1 }, { unique: true });

export const ChatModel = model<Chat>(DOCUMENT_NAME, schema, COLLECTION_NAME);
