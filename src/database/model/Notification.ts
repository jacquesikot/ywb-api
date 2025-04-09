import { Schema, Types, model } from 'mongoose';

export const DOCUMENT_NAME = 'Notification';
export const COLLECTION_NAME = 'Notifications';

export enum NotificationType {
  NEW_MESSAGE = 'new_message',
  NEW_WAVE = 'new_wave',
}

export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
}

export default interface Notification {
  _id: Types.ObjectId;
  type: NotificationType;
  userId: Types.ObjectId;
  message: string;
  data: any;
  status: NotificationStatus;
  createAt: Date;
}

const schema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      type: Object,
      required: false,
    },
    status: {
      type: String,
      enum: Object.values(NotificationStatus),
      default: NotificationStatus.UNREAD,
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
