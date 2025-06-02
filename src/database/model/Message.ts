import { Schema, model, Types } from 'mongoose';

export const DOCUMENT_NAME = 'Message';
export const COLLECTION_NAME = 'messages';

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  FILE = 'FILE',
}

export default interface Message {
  _id: Types.ObjectId;
  chatId: Types.ObjectId;
  userId: Types.ObjectId;
  content: String;
  type: MessageType;
  audioUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  fileExtension?: string;
  timestamp: Date;
  isRead: boolean;
}

const schema = new Schema<Message>(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(MessageType),
      default: MessageType.TEXT,
    },
    audioUrl: {
      type: String,
      required: false,
    },
    imageUrl: {
      type: String,
      required: false,
    },
    videoUrl: {
      type: String,
      required: false,
    },
    fileUrl: {
      type: String,
      required: false,
    },
    fileName: {
      type: String,
      required: false,
    },

    fileType: {
      type: String,
      validate: {
        validator: function (this: Message, v: string) {
          return this.type !== MessageType.TEXT ? v !== undefined : true;
        },
        message: 'File Type is required',
      },
    },
    fileSize: {
      type: Number,
      required: false,
    },
    fileExtension: {
      type: String,
      required: false,
    },
    timestamp: {
      type: Date,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    versionKey: false,
  },
);

schema.index({ chatId: 1, senderId: 1 });

export const MessageModel = model<Message>(
  DOCUMENT_NAME,
  schema,
  COLLECTION_NAME,
);
