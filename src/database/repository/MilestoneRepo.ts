import Milestone, { MilestoneModel, MilestoneStatus } from '../model/Milestone';
import { Types } from 'mongoose';

async function create(milestoneData: Partial<Milestone>): Promise<Milestone> {
  const newMilestone = new MilestoneModel(milestoneData);
  return (await newMilestone.save()).populate('proposalId', {
    _id: 1,
    title: 1,
  });
}

async function createMany(
  milestonesData: Partial<Milestone>[],
): Promise<Partial<Milestone>[]> {
  const milestones = await MilestoneModel.insertMany(milestonesData);
  return milestones;
}

async function findById(id: string): Promise<Milestone | null> {
  return MilestoneModel.findById(id)
    .populate('proposalId', { _id: 1, title: 1 })
    .lean()
    .exec();
}

async function findByProposal(
  proposalId: Types.ObjectId,
): Promise<Milestone[]> {
  return MilestoneModel.find({ proposalId }).lean().exec();
}

async function updateById(
  id: string,
  updates: Partial<Milestone>,
): Promise<Milestone | null> {
  return MilestoneModel.findByIdAndUpdate(
    id,
    { ...updates, updatedAt: new Date() },
    { new: true },
  )
    .populate('proposalId', { _id: 1, title: 1 })
    .lean()
    .exec();
}

async function updateStatusById(
  id: string,
  status: string,
): Promise<Milestone | null> {
  return updateById(id, { status: status });
}

export default {
  create,
  createMany,
  findById,
  findByProposal,
  updateById,
  updateStatusById,
};
