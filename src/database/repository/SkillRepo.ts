import Skill, { SkillModel } from '../model/Skill';
import { Types } from 'mongoose';

async function findByName(name: string): Promise<Skill | null> {
  return SkillModel.findOne({ name: name }).lean().exec();
}

async function findByType(type: string): Promise<Skill | null> {
  return SkillModel.findOne({ type: type }).lean().exec();
}

async function findById(id: string): Promise<Skill | null> {
  return SkillModel.findById(id).lean().exec();
}

async function findByIds(ids: Types.ObjectId[]): Promise<Skill[]> {
  return SkillModel.find({ _id: { $in: ids } })
    .lean()
    .exec();
}

async function create(skillData: Partial<Skill>): Promise<Skill> {
  skillData.createdAt = skillData.updatedAt = new Date();
  if (skillData.name)
    skillData.slug = skillData.name.toLowerCase().replace(/ /g, '-');
  const newSkill = new SkillModel(skillData);
  return newSkill.save();
}

async function deleteById(id: string): Promise<Skill | null> {
  return SkillModel.findByIdAndDelete(id).lean().exec();
}

async function findAll(): Promise<Skill[]> {
  return SkillModel.find().lean().exec();
}

export default {
  findByName,
  findByType,
  findById,
  findByIds,
  create,
  deleteById,
  findAll,
};
