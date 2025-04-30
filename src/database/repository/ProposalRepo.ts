import Proposal, { ProposalModel, ProposalStatus } from '../model/Proposal';
import { Types } from 'mongoose';

async function create(proposalData: Partial<Proposal>): Promise<Proposal> {
  const newProposal = new ProposalModel(proposalData);
  const savedProposal = await newProposal.save();
  return ProposalModel.findById(savedProposal._id)
    .populate('user', { _id: 1, name: 1, email: 1 })
    .populate('job', { _id: 1, title: 1 })
    .exec()
    .then((proposal) => proposal!);
}

async function findById(id: string): Promise<Proposal | null> {
  return ProposalModel.findById(id)
    .populate('user', { _id: 1, name: 1, email: 1 })
    .populate('job', { _id: 1, title: 1 })
    .lean()
    .exec();
}

async function findByUser(userId: Types.ObjectId): Promise<Proposal[]> {
  return ProposalModel.find({ user: userId })
    .populate('job', { _id: 1, title: 1 })
    .populate('user', { _id: 1, name: 1, email: 1 })
    .lean()
    .exec();
}

async function findByJob(jobId: Types.ObjectId): Promise<Proposal[]> {
  return ProposalModel.find({ job: jobId })
    .populate('user', { _id: 1, name: 1, email: 1 })
    .lean()
    .exec();
}

async function updateById(
  id: string,
  updates: Partial<Proposal>,
): Promise<Proposal | null> {
  return ProposalModel.findByIdAndUpdate(
    id,
    { ...updates, updatedAt: new Date() },
    { new: true },
  )
    .populate('user', { _id: 1, name: 1, email: 1 })
    .populate('job', { _id: 1, title: 1 })
    .lean()
    .exec();
}

async function updateStatusById(
  id: string,
  status: string,
): Promise<Proposal | null> {
  return updateById(id, { status: status });
}

export default {
  create,
  findById,
  findByUser,
  findByJob,
  updateById,
  updateStatusById,
};
