import Education, { EducationModel } from '../model/Education';
import { Types } from 'mongoose';

export default class EducationRepo {
  static async create(education: Partial<Education>): Promise<Education> {
    return EducationModel.create(education);
  }

  static async findByUser(userId: Types.ObjectId): Promise<Education[]> {
    return EducationModel.find({ user: userId }).exec();
  }

  static async findById(id: Types.ObjectId): Promise<Education | null> {
    return EducationModel.findById(id).exec();
  }

  static async updateById(id: Types.ObjectId, update: Partial<Education>): Promise<Education | null> {
    return EducationModel.findByIdAndUpdate(id, update, { new: true }).exec();
  }

  static async deleteById(id: Types.ObjectId): Promise<Education | null> {
    return EducationModel.findByIdAndDelete(id).exec();
  }
}
