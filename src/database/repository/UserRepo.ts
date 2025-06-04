import User, { UserModel, Plan, PlanType } from '../model/User';
import { RoleModel } from '../model/Role';
import { InternalError } from '../../core/ApiError';
import { Types } from 'mongoose';
import KeystoreRepo from './KeystoreRepo';
import Keystore from '../model/Keystore';

async function exists(id: Types.ObjectId): Promise<boolean> {
  const user = await UserModel.exists({ _id: id, status: true });
  return user !== null && user !== undefined;
}

async function findPrivateProfileById(
  id: Types.ObjectId,
): Promise<User | null> {
  return UserModel.findOne({ _id: id, status: true })
    .select('+email +bio +location +availability +jobRole')
    .populate({
      path: 'role',
      match: { status: true },
      select: { code: 1 },
    })
    .populate({
      path: 'skills',
      match: { status: true },
      select: { name: 1 },
    })
    .populate({
      path: 'talentPoolPreferences',
      match: { status: true },
      select: { name: 1 },
    })
    .lean<User>()
    .exec();
}

// contains critical information of the user
async function findById(id: Types.ObjectId): Promise<User | null> {
  return UserModel.findOne({ _id: id, status: true })
    .select('+email +password +role +bio +jobRole')
    .populate({
      path: 'role',
      match: { status: true },
    })
    .lean()
    .exec();
}

async function findByEmail(email: string): Promise<User | null> {
  return UserModel.findOne({ email: email })
    .select(
      '+email +password +role +jobRole +gender +dob +grade +country +state +city +school +bio +hobbies',
    )
    .populate({
      path: 'role',
      match: { status: true },
      select: { code: 1 },
    })
    .lean()
    .exec();
}

async function findFieldsById(
  id: Types.ObjectId,
  ...fields: string[]
): Promise<User | null> {
  return UserModel.findOne({ _id: id, status: true }, [...fields])
    .lean()
    .exec();
}

async function findPublicProfileById(id: Types.ObjectId): Promise<User | null> {
  return UserModel.findOne({ _id: id, status: true })
    .select('+bio +jobRole')
    .lean()
    .exec();
}

async function findUsersWithMatchingSkills(
  skillIds: Types.ObjectId[],
  excludeUserId: Types.ObjectId,
): Promise<User[]> {
  return UserModel.find({
    $and: [
      { _id: { $ne: excludeUserId } }, // Exclude the requesting user
      { status: true },
      {
        $or: [
          { skills: { $in: skillIds } },
          { talentPoolPreferences: { $in: skillIds } },
        ],
      },
    ],
  })
    .populate({
      path: 'role',
      match: { status: true },
      select: { code: 1 },
    })
    .populate({
      path: 'skills',
      match: { status: true },
      select: { name: 1 },
    })
    .populate({
      path: 'talentPoolPreferences',
      match: { status: true },
      select: { name: 1 },
    })
    .lean<User[]>()
    .exec();
}

async function findUsersByRole(
  roles: string[],
  filters: {
    skills?: string[];
    experienceLevel?: string;
    location?: {
      country?: string;
      state?: string;
      city?: string;
    };
  },
  pagination: {
    page: number;
    limit: number;
  },
): Promise<{ users: User[]; total: number }> {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  // Base query with proper typing
  const baseQuery: Record<string, any> = {
    status: true,
  };

  // Add skill filter if provided
  if (filters.skills && filters.skills.length > 0) {
    baseQuery['skills'] = {
      $in: filters.skills.map((id) => new Types.ObjectId(id)),
    };
  }

  // Add experience level filter if provided
  if (filters.experienceLevel) {
    baseQuery['experienceLevel'] = filters.experienceLevel;
  }

  // Add location filters if provided
  if (filters.location) {
    if (filters.location.country) {
      baseQuery['location.country'] = filters.location.country;
    }
    if (filters.location.state) {
      baseQuery['location.state'] = filters.location.state;
    }
    if (filters.location.city) {
      baseQuery['location.city'] = filters.location.city;
    }
  }

  // First, get total count for pagination
  // For counting, we need to join with roles to filter by role code
  const roleIds = await RoleModel.find({ code: { $in: roles }, status: true })
    .select('_id')
    .lean()
    .exec();

  // Use the roleIds for filtering
  baseQuery['role'] = { $in: roleIds.map((r) => r._id) };

  const total = await UserModel.countDocuments(baseQuery);

  // Then get paginated results
  const users = await UserModel.find(baseQuery)
    .skip(skip)
    .limit(limit)
    .select('+email +bio +location +availability +jobRole')
    .populate({
      path: 'role',
      match: { code: { $in: roles }, status: true },
      select: { code: 1 },
    })
    .populate({
      path: 'skills',
      match: { status: true },
      select: { name: 1 },
    })
    .populate({
      path: 'talentPoolPreferences',
      match: { status: true },
      select: { name: 1 },
    })
    .lean<User[]>()
    .exec();

  // Filter out any users that might have null roles after population
  // (this can happen if the populate match condition excluded the role)
  const filteredUsers = users.filter((user) => user.role);

  return { users: filteredUsers, total };
}

async function create(
  user: User,
  accessTokenKey: string,
  refreshTokenKey: string,
  roleCode: string,
): Promise<{ user: User; keystore: Keystore }> {
  const now = new Date();
  const role = await RoleModel.findOne({ code: roleCode })
    .select('_id code')
    .lean()
    .exec();
  if (!role) {
    throw new InternalError('Role must be defined');
  }

  user.role = { _id: role._id, code: role.code };
  user.createdAt = user.updatedAt = now;
  user.walletBalance = 0; // Explicitly set walletBalance to 0
  user.plan = Plan.FREE;
  user.planType = PlanType.MONTHLY;

  console.log('user', user);
  const createdUser = await UserModel.create(user);
  console.log('createdUser', createdUser);
  const keystore = await KeystoreRepo.create(
    createdUser,
    accessTokenKey,
    refreshTokenKey,
  );

  return {
    user: { ...createdUser.toObject(), role: user.role },
    keystore: keystore,
  };
}

async function update(
  user: User,
  accessTokenKey: string,
  refreshTokenKey: string,
): Promise<{ user: User; keystore: Keystore }> {
  user.updatedAt = new Date();
  await UserModel.updateOne({ _id: user._id }, { $set: { ...user } })
    .lean()
    .exec();
  const keystore = await KeystoreRepo.create(
    user,
    accessTokenKey,
    refreshTokenKey,
  );
  return { user: user, keystore: keystore };
}

async function updateInfo(user: User): Promise<any> {
  user.updatedAt = new Date();
  return UserModel.updateOne({ _id: user._id }, { $set: { ...user } })
    .lean()
    .exec();
}

async function createGoogleUser({
  name,
  email,
  profilePicUrl,
  roleCode,
}: {
  name: string;
  email: string;
  profilePicUrl?: string;
  roleCode: string;
}) {
  const role = await RoleModel.findOne({ code: roleCode })
    .select('_id code')
    .lean()
    .exec();
  if (!role) {
    throw new InternalError('Role must be defined');
  }
  const now = new Date();
  const user = await UserModel.create({
    name,
    email,
    profilePicUrl,
    verified: true,
    role: role._id,
    status: true,
    createdAt: now,
    updatedAt: now,
    plan: Plan.FREE,
    planType: PlanType.MONTHLY,
    walletBalance: 0, // Explicitly set walletBalance to 0
  });
  return user.toObject();
}

export default {
  exists,
  findPrivateProfileById,
  findById,
  findByEmail,
  findFieldsById,
  findPublicProfileById,
  findUsersWithMatchingSkills,
  findUsersByRole,
  create,
  createGoogleUser,
  update,
  updateInfo,
};
