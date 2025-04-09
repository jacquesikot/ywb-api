import Notification, {
  NotificationModel,
  NotificationStatus,
} from '../model/Notification';

async function findById(id: string): Promise<Notification | null> {
  return await NotificationModel.findById(id).lean().exec();
}

async function findByUserId(userId: string): Promise<Notification[]> {
  return await NotificationModel.find({ userId }).lean().exec();
}

async function create(
  notificationData: Partial<Notification>,
): Promise<Notification> {
  notificationData.createAt = new Date();
  const newNotification = await NotificationModel.create(notificationData);
  return newNotification.save();
}

async function updateStatus(
  notificationId: string,
  status: NotificationStatus,
): Promise<Notification | null> {
  return await NotificationModel.findByIdAndUpdate(
    notificationId,
    { status },
    { new: true },
  )
    .lean()
    .exec();
}

async function markAllAsRead(userId: string, chatId: string): Promise<void> {
  await NotificationModel.updateMany(
    { userId, data: { chatId }, status: NotificationStatus.UNREAD },
    { status: NotificationStatus.READ },
  );
}

async function deleteById(id: string): Promise<Notification | null> {
  return await NotificationModel.findByIdAndDelete(id).lean().exec();
}

async function findAll(): Promise<Notification[]> {
  return NotificationModel.find().lean().exec();
}

export default {
  findById,
  findByUserId,
  create,
  updateStatus,
  markAllAsRead,
  deleteById,
  findAll,
};
