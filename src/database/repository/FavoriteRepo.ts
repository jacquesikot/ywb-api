import { Types } from 'mongoose';
import Favorite, { FavoriteModel } from '../model/Favorite';

export default class FavoriteRepo {
  public static async create(
    user: Types.ObjectId,
    job: Types.ObjectId,
  ): Promise<Favorite> {
    const now = new Date();
    const favorite = await FavoriteModel.create({
      user,
      job,
      createdAt: now,
      updatedAt: now,
    });
    return favorite.toObject();
  }

  public static async findByUser(user: Types.ObjectId): Promise<Favorite[]> {
    return FavoriteModel.find({ user })
      .select('+createdAt')
      .populate({
        path: 'job',
        populate: [
          { path: 'skills' },
          { path: 'user', select: 'name profilePicUrl companyName' },
        ],
      })
      .lean()
      .exec();
  }

  public static async findOne(
    user: Types.ObjectId,
    job: Types.ObjectId,
  ): Promise<Favorite | null> {
    return FavoriteModel.findOne({ user, job }).lean().exec();
  }

  public static async remove(
    user: Types.ObjectId,
    job: Types.ObjectId,
  ): Promise<boolean> {
    const result = await FavoriteModel.deleteOne({ user, job }).exec();
    return result.deletedCount > 0;
  }

  public static async isJobFavorited(
    user: Types.ObjectId,
    job: Types.ObjectId,
  ): Promise<boolean> {
    const count = await FavoriteModel.countDocuments({ user, job }).exec();
    return count > 0;
  }
}
