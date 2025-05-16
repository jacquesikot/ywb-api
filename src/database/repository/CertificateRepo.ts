import Certificate, { CertificateModel } from '../model/Certificate';
import { Types } from 'mongoose';

export default class CertificateRepo {
  static async create(certificate: Partial<Certificate>): Promise<Certificate> {
    return CertificateModel.create(certificate);
  }

  static async findByUser(userId: Types.ObjectId): Promise<Certificate[]> {
    return CertificateModel.find({ user: userId })
      .sort({ yearIssued: -1 })
      .exec();
  }

  static async findById(id: Types.ObjectId): Promise<Certificate | null> {
    return CertificateModel.findById(id).exec();
  }

  static async updateById(
    id: Types.ObjectId,
    update: Partial<Certificate>,
  ): Promise<Certificate | null> {
    return CertificateModel.findByIdAndUpdate(id, update, { new: true }).exec();
  }

  static async deleteById(id: Types.ObjectId): Promise<Certificate | null> {
    return CertificateModel.findByIdAndDelete(id).exec();
  }
}
