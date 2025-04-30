import Job, { JobModel, JobStatus } from '../model/Job';
import { RoleCode } from '../model/Role';
import Skill from '../model/Skill';
import User from '../model/User';
import { Types } from 'mongoose';

async function findByTitle(title: string): Promise<Job | null> {
  return JobModel.findOne({ title: title, status: 'open' }).lean().exec();
}

async function findByTitles(titles: string[]): Promise<Job[]> {
  return JobModel.find({ title: { $in: titles }, status: 'open' })
    .lean()
    .exec();
}

async function findById(id: string): Promise<Job | null> {
  return JobModel.findById(id)
    .populate('user', { _id: 1, name: 1, email: 1 })
    .lean()
    .exec();
}

async function create(jobData: Partial<Job>): Promise<Job> {
  jobData.status = JobStatus.OPEN;
  jobData.createdAt = jobData.updatedAt = new Date();
  const newJob = new JobModel(jobData);
  return (await newJob.save()).populate('skills', {
    _id: 1,
    name: 1,
  });
}

async function deleteById(id: string): Promise<Job | null> {
  return JobModel.findByIdAndDelete(id).lean().exec();
}

async function findAll(filter: any = {}): Promise<Job[]> {
  return JobModel.find(filter)
    .select('+createdAt')
    .populate('skills', { _id: 1, name: 1 })
    .populate('user', { _id: 1, name: 1, email: 1, role: 1 })
    .sort({ createdAt: -1 })
    .lean()
    .exec();
}

async function updateStatusById(
  id: string,
  status: string,
): Promise<Job | null> {
  return JobModel.findByIdAndUpdate(
    id,
    { status: status, updatedAt: new Date() },
    { new: true },
  )
    .lean()
    .exec();
}

export function getSkillsFromUser(user: User): Skill[] {
  let skills: Skill[] = user.skills as any;

  if (user.role.code === RoleCode.BUSINESS && user.talentPoolPreferences)
    skills = user.talentPoolPreferences;
  if (user.role.code === RoleCode.CLIENT && user.talentPoolPreferences)
    skills = [...user.talentPoolPreferences, ...skills];
  return skills;
}

async function findJobMatch(user: User): Promise<Job[]> {
  let skills: Skill[] = getSkillsFromUser(user);

  return JobModel.find({
    skills: { $in: skills },
    status: JobStatus.OPEN,
  })
    .populate('skills', { _id: 1, name: 1 })
    .populate('user', { _id: 1, name: 1, email: 1, role: 1 })
    .lean()
    .exec();
}

async function findByUserId(
  userId: Types.ObjectId,
  statusFilter?: JobStatus | JobStatus[],
): Promise<Job[]> {
  const filter: any = { user: userId };

  if (statusFilter) {
    if (Array.isArray(statusFilter)) {
      filter.status = { $in: statusFilter };
    } else {
      filter.status = statusFilter;
    }
  }

  return JobModel.find(filter)
    .select('+createdAt')
    .populate('skills', { _id: 1, name: 1 })
    .populate('user', { _id: 1, name: 1, email: 1, role: 1 })
    .sort({ createdAt: -1 })
    .lean()
    .exec();
}

export default {
  findByTitle,
  findByTitles,
  findById,
  create,
  deleteById,
  findAll,
  updateStatusById,
  findJobMatch,
  findByUserId,
};
