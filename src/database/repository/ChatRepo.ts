import Chat, { ChatModel } from '../model/Chat';
import { MessageModel } from '../model/Message';
import JobRepo from './JobRepo';

async function findById(id: string): Promise<Chat | null> {
  return ChatModel.findById(id).lean().exec();
}

async function findByJobId(jobId: string): Promise<Chat[]> {
  return ChatModel.find({ jobId }).lean().exec();
}

async function findByWaveId(waveId: string): Promise<Chat | null> {
  return ChatModel.findOne({ waveId }).lean().exec();
}

async function findByUserId(userId: string): Promise<Chat[]> {
  return ChatModel.find({ userId }).lean().exec();
}

async function findByMemberId(memberId: string): Promise<any[]> {
  const chats = await ChatModel.find({ members: { $in: [memberId] } })
    .populate('members')
    .populate('ownerId')
    .lean()
    .exec();

  // Populate job details and messages for each chat
  const chatsWithDetails = await Promise.all(
    chats.map(async (chat) => {
      const [jobDetails, recentMessages] = await Promise.all([
        chat.jobId ? JobRepo.findById(chat.jobId.toString()) : null,
        MessageModel.find({ chatId: chat._id })
          .sort({ timestamp: -1 })
          .limit(20)
          .populate('userId')
          .lean()
          .exec(),
      ]);

      return {
        ...chat,
        jobDetails,
        recentMessages,
      };
    }),
  );

  return chatsWithDetails;
}

async function create(chatData: Partial<Chat>): Promise<Chat> {
  chatData.createdAt = new Date();
  const newChat = new ChatModel(chatData);
  return newChat.save();
}

async function deleteById(id: string): Promise<Chat | null> {
  return ChatModel.findByIdAndDelete(id).lean().exec();
}

async function update(
  id: string,
  chatData: Partial<Chat>,
): Promise<Chat | null> {
  return ChatModel.findByIdAndUpdate(id, chatData, { new: true }).lean().exec();
}

async function findAll(): Promise<Chat[]> {
  return ChatModel.find().lean().exec();
}

export default {
  findById,
  findByJobId,
  findByUserId,
  findByMemberId,
  findByWaveId,
  create,
  update,
  deleteById,
  findAll,
};
