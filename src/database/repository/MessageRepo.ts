import Message, { MessageModel } from '../model/Message';

async function findById(id: string): Promise<Message | null> {
  return MessageModel.findById(id).lean().exec();
}

async function findByChatId(chatId: string): Promise<Message[]> {
  return MessageModel.find({ chatId }).lean().exec();
}

async function findBySenderId(senderId: string): Promise<Message[]> {
  return MessageModel.find({ senderId }).lean().exec();
}

async function create(messageData: Partial<Message>): Promise<Message> {
  messageData.timestamp = new Date();
  const newMessage = new MessageModel(messageData);
  return newMessage.save();
}

async function deleteById(id: string): Promise<Message | null> {
  return MessageModel.findByIdAndDelete(id).lean().exec();
}

async function markAsRead(id: string): Promise<Message | null> {
  return MessageModel.findByIdAndUpdate(id, { isRead: true }, { new: true });
}

async function findAll(): Promise<Message[]> {
  return MessageModel.find().lean().exec();
}

export default {
  findById,
  findByChatId,
  findBySenderId,
  create,
  deleteById,
  markAsRead,
  findAll,
};
