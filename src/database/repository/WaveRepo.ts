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
  const updatedWave = await WaveModel.findByIdAndUpdate(
    id,
    {
      $set: {
        status,
        updatedAt: new Date(),
      },
    },
    { new: true },
  )
    .lean()
    .exec();

  return updatedWave;
}

async function findAll(): Promise<Wave[]> {
  return WaveModel.find().lean().exec();
}

async function findTopFreelancersByWaves(
  limit: number = 10,
  filters: {
    skills?: string[];
    location?: {
      country?: string;
      state?: string;
      city?: string;
    };
  } = {},
): Promise<any[]> {
  const pipeline: any[] = [
    // Group by freelancerId and count waves
    {
      $group: {
        _id: '$freelancerId',
        waveCount: { $sum: 1 },
      },
    },
    // Lookup the user details
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    // Unwind the user array to get a single object
    {
      $unwind: '$user',
    },
    // Lookup the role to filter only FREELANCERS
    {
      $lookup: {
        from: 'roles',
        localField: 'user.role',
        foreignField: '_id',
        as: 'role',
      },
    },
    // Unwind the role array
    {
      $unwind: '$role',
    },
    // Match only FREELANCER role
    {
      $match: {
        'role.code': 'FREELANCER',
        'user.status': true,
      },
    },
  ];

  // Add location filter if provided
  if (filters.location) {
    const locationMatch: any = {};

    if (filters.location.country) {
      locationMatch['user.location.country'] = filters.location.country;
    }

    if (filters.location.state) {
      locationMatch['user.location.state'] = filters.location.state;
    }

    if (filters.location.city) {
      locationMatch['user.location.city'] = filters.location.city;
    }

    if (Object.keys(locationMatch).length > 0) {
      pipeline.push({ $match: locationMatch });
    }
  }

  // Lookup skills to be able to filter by skill names
  if (filters.skills && filters.skills.length > 0) {
    pipeline.push(
      // Lookup skills collection to get skill names
      {
        $lookup: {
          from: 'skills',
          localField: 'user.skills',
          foreignField: '_id',
          as: 'skillDetails',
        },
      },
      // Match users with the specified skills
      {
        $match: {
          'skillDetails.name': { $in: filters.skills },
        },
      },
    );
  }

  // Add the final projection and sorting stages
  pipeline.push(
    // Select relevant fields and reshape
    {
      $project: {
        _id: '$user._id',
        name: '$user.name',
        email: '$user.email',
        profilePicUrl: '$user.profilePicUrl',
        bio: '$user.bio',
        location: '$user.location',
        jobRole: '$user.jobRole',
        waveCount: 1,
        skills: '$user.skills',
        skillDetails: 1,
      },
    },
    // Sort by wave count in descending order
    {
      $sort: {
        waveCount: -1,
      },
    },
    // Limit results
    {
      $limit: limit,
    },
  );

  return WaveModel.aggregate(pipeline).exec();
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
  findTopFreelancersByWaves,
};
