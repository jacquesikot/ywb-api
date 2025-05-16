import WorkHistory, { WorkHistoryModel } from '../model/WorkHistory';
import { Types } from 'mongoose';

export default class WorkHistoryRepo {
  static async create(workHistory: Partial<WorkHistory>): Promise<WorkHistory> {
    return WorkHistoryModel.create(workHistory);
  }

  static async findByUser(userId: Types.ObjectId): Promise<WorkHistory[]> {
    return WorkHistoryModel.find({ user: userId })
      .sort({ startYear: -1 })
      .exec();
  }

  static async findById(id: Types.ObjectId): Promise<WorkHistory | null> {
    return WorkHistoryModel.findById(id).exec();
  }

  static async updateById(
    id: Types.ObjectId,
    update: Partial<WorkHistory>,
  ): Promise<WorkHistory | null> {
    return WorkHistoryModel.findByIdAndUpdate(id, update, { new: true }).exec();
  }

  static async deleteById(id: Types.ObjectId): Promise<WorkHistory | null> {
    return WorkHistoryModel.findByIdAndDelete(id).exec();
  }
}
