import Role, { RoleModel } from '../model/Role';

async function findByCode(code: string): Promise<Role | null> {
  return RoleModel.findOne({ code: code, status: true }).lean().exec();
}

async function findByCodes(codes: string[]): Promise<Role[]> {
  return RoleModel.find({ code: { $in: codes }, status: true })
    .lean()
    .exec();
}

async function findByName(name: string): Promise<Role | null> {
  return RoleModel.findOne({ name: name, status: true }).lean().exec();
}

async function findById(id: string): Promise<Role | null> {
  return RoleModel.findById(id).lean().exec();
}

async function create(roleData: Partial<Role>): Promise<Role> {
  roleData.status = true;
  roleData.createdAt = roleData.updatedAt = new Date();
  const newRole = new RoleModel(roleData);
  return newRole.save();
}

async function deleteById(id: string): Promise<Role | null> {
  return RoleModel.findByIdAndDelete(id).lean().exec();
}

async function findAll(): Promise<Role[]> {
  return RoleModel.find().lean().exec();
}

export default {
  findByCode,
  findByCodes,
  findByName,
  findById,
  create,
  deleteById,
  findAll,
};
