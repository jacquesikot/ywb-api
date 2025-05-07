import Project, { ProjectModel } from '../model/Project';
import { Types } from 'mongoose';

export default class ProjectRepo {
  static async create(project: Partial<Project>): Promise<Project> {
    return ProjectModel.create(project);
  }

  static async findByUser(userId: Types.ObjectId): Promise<Project[]> {
    return ProjectModel.find({ user: userId }).exec();
  }

  static async findById(id: Types.ObjectId): Promise<Project | null> {
    return ProjectModel.findById(id).exec();
  }

  static async updateById(
    id: Types.ObjectId,
    update: Partial<Project>,
  ): Promise<Project | null> {
    return ProjectModel.findByIdAndUpdate(id, update, { new: true }).exec();
  }

  static async deleteById(id: Types.ObjectId): Promise<Project | null> {
    return ProjectModel.findByIdAndDelete(id).exec();
  }

  static async findAll(): Promise<Project[]> {
    return ProjectModel.find()
      .populate('user', 'name profilePicture bio')
      .exec();
  }
}
