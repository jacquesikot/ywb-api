import Chat, { ChatModel } from '../model/Chat';

async function findById(id: string): Promise<Chat | null> {
  return ChatModel.findById(id).lean().exec();
}

async function findByJobId(jobId: string): Promise<Chat[]> {
  return ChatModel.find({ jobId }).lean().exec();
}

async function findByUserId(userId: string): Promise<Chat[]> {
  return ChatModel.find({ userId }).lean().exec();
}

async function create(chatData: Partial<Chat>): Promise<Chat> {
  chatData.createdAt = new Date();
  const newChat = new ChatModel(chatData);
  return newChat.save();
}

async function deleteById(id: string): Promise<Chat | null> {
  return ChatModel.findByIdAndDelete(id).lean().exec();
}

async function findAll(): Promise<Chat[]> {
  return ChatModel.find().lean().exec();
}

export default {
  findById,
  findByJobId,
  findByUserId,
  create,
  deleteById,
  findAll,
};
