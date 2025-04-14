import { Types } from 'mongoose';
import KYC, { KYCModel } from '../model/KYC';
import User from '../model/User';

async function exists(userId: Types.ObjectId): Promise<boolean> {
  const kyc = await KYCModel.exists({ user: userId });
  return kyc !== null && kyc !== undefined;
}

async function create(kyc: KYC): Promise<KYC> {
  const now = new Date();
  kyc.createdAt = now;
  kyc.updatedAt = now;

  const createdKYC = await KYCModel.create(kyc);
  return createdKYC.toObject();
}

async function update(kyc: KYC): Promise<KYC | null> {
  kyc.updatedAt = new Date();

  await KYCModel.updateOne({ _id: kyc._id }, { $set: { ...kyc } })
    .lean()
    .exec();

  return findById(kyc._id);
}

async function findById(id: Types.ObjectId): Promise<KYC | null> {
  return KYCModel.findOne({ _id: id }).lean().exec();
}

async function findByUser(userId: Types.ObjectId): Promise<KYC | null> {
  return KYCModel.findOne({ user: userId }).lean().exec();
}

async function findAll(
  filters: { approved?: boolean } = {},
  pagination: { limit?: number; offset?: number } = {},
): Promise<KYC[]> {
  const query = KYCModel.find({ ...filters });

  if (pagination.limit !== undefined) query.limit(pagination.limit);
  if (pagination.offset !== undefined) query.skip(pagination.offset);

  return query.sort({ createdAt: -1 }).lean().exec();
}

export default {
  exists,
  create,
  update,
  findById,
  findByUser,
  findAll,
};
