import User, { UserModel } from '../model/User';
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
    .select('+email')
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
    .select('+email +password +role')
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
      '+email +password +role +gender +dob +grade +country +state +city +school +bio +hobbies',
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
  return UserModel.findOne({ _id: id, status: true }).lean().exec();
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

  const createdUser = await UserModel.create(user);
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
    plan: 'FREE',
    planType: 'MONTHLY',
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
  create,
  createGoogleUser,
  update,
  updateInfo,
};
