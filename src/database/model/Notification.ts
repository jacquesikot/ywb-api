import { Schema, Types, model } from 'mongoose';

export const DOCUMENT_NAME = 'Notification';
export const COLLECTION_NAME = 'Notifications';

export default interface Notification {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  chatId: Types.ObjectId;
  messageId: Types.ObjectId;
  status: 'unread' | 'read';
  createAt: Date;
}

const schema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
    },
    chatId: {
      type: Types.ObjectId,
      ref: 'Chat',
      required: true,
    },
    messageId: {
      type: Types.ObjectId,
      ref: 'Message',
      required: true,
    },
    status: {
      type: String,
      enum: ['unread', 'read'],
      default: 'unread',
    },
    createAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  },
);
schema.index({ userId: 1, status: 1 });

export const NotificationModel = model<Notification>(
  DOCUMENT_NAME,
  schema,
  COLLECTION_NAME,
);
