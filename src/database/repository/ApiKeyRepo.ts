import ApiKey, { ApiKeyModel, Permission } from '../model/ApiKey';
import crypto from 'crypto';

async function findByKey(key: string): Promise<ApiKey | null> {
  return ApiKeyModel.findOne({ key: key, status: true }).lean().exec();
}

async function create(permissions: Permission[]): Promise<ApiKey> {
  const now = new Date();
  const apiKey = {} as ApiKey;
  apiKey.createdAt = apiKey.updatedAt = now;
  apiKey.status = true;
  apiKey.version = 1;
  apiKey.permissions = permissions;
  // Generate a random 32-byte API key and convert it to a hexadecimal string
  apiKey.key = crypto.randomBytes(32).toString('hex');
  return ApiKeyModel.create(apiKey);
}

async function findAll(): Promise<ApiKey[]> {
  return ApiKeyModel.find({ status: true }).lean().exec();
}

export default {
  findByKey,
  create,
  findAll,
};
