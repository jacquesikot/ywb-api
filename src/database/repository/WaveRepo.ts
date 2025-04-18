import { Types } from 'mongoose';
import Wave, { WaveStatus, WaveModel } from '../model/Wave';

async function findById(id: string): Promise<Wave | null> {
  return WaveModel.findById(id).lean().exec();
}

async function findJobById(jobId: string): Promise<Wave[]> {
  return WaveModel.find({ jobId }).lean().exec();
}

async function findFreelancerById(freelancerId: string): Promise<Wave[]> {
  return WaveModel.find({ freelancerId }).lean().exec();
}

async function findByJobOwnerId(userId: string): Promise<Wave[]> {
  return WaveModel.aggregate([
    {
      $lookup: {
        from: 'jobs',
        localField: 'jobId',
        foreignField: '_id',
        as: 'job',
      },
    },
    {
      $match: {
        'job.user': new Types.ObjectId(userId),
      },
    },
    {
      $project: {
        job: 0, // Remove the job field from the result
      },
    },
  ]).exec();
}

async function create(waveData: Partial<Wave>): Promise<Wave> {
  waveData.createdAt = new Date();
  const newWave = new WaveModel(waveData);
  return newWave.save();
}

async function deleteById(id: string): Promise<Wave | null> {
  return WaveModel.findByIdAndDelete(id).lean().exec();
}

async function updateStatusById(
  id: string,
  status: WaveStatus,
): Promise<Wave | null> {
  return WaveModel.findByIdAndUpdate(
    id,
    { status, createdAt: new Date() },
    { new: true },
  )
    .lean()
    .exec();
}

async function findAll(): Promise<Wave[]> {
  return WaveModel.find().lean().exec();
}

export default {
  findById,
  findJobById,
  findFreelancerById,
  findByJobOwnerId,
  create,
  deleteById,
  updateStatusById,
  findAll,
};
