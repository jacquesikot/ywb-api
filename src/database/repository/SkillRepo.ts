import Skill, { SkillModel } from '../model/Skill';

async function findByName(name: string): Promise<Skill | null> {
  return SkillModel.findOne({ name: name }).lean().exec();
}

async function findByType(type: string): Promise<Skill | null> {
  return SkillModel.findOne({ type: type }).lean().exec();
}

async function findById(id: string): Promise<Skill | null> {
  return SkillModel.findById(id).lean().exec();
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
  create,
  deleteById,
  findAll,
};
