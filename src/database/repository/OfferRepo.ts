import Offer, { OfferModel, OfferStatus } from '../model/Offer';
import { Types } from 'mongoose';

export default class OfferRepo {
  static async create(offer: Partial<Offer>): Promise<Offer> {
    return OfferModel.create({
      ...offer,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static async findById(id: Types.ObjectId): Promise<Offer | null> {
    return OfferModel.findById(id)
      .populate('job')
      .populate('user', 'name email profilePicUrl')
      .populate('freelancer', 'name email profilePicUrl')
      .exec();
  }

  static async findByFreelancer(
    freelancerId: Types.ObjectId,
    status?: OfferStatus,
  ): Promise<Offer[]> {
    const query: any = { freelancer: freelancerId };
    if (status) query.status = status;

    return OfferModel.find(query)
      .populate({
        path: 'job',
        populate: {
          path: 'skills',
          select: '_id name',
        },
      })
      .populate('user', 'name email profilePicUrl companyName')
      .sort({ createdAt: -1 })
      .exec();
  }

  static async findByUser(
    userId: Types.ObjectId,
    status?: OfferStatus,
  ): Promise<Offer[]> {
    const query: any = { user: userId };
    if (status) query.status = status;

    return OfferModel.find(query)
      .populate('job')
      .populate('freelancer', 'name email profilePicUrl')
      .sort({ createdAt: -1 })
      .exec();
  }

  static async findByBusiness(
    businessId: Types.ObjectId,
    status?: OfferStatus,
  ): Promise<Offer[]> {
    const query: any = { business: businessId };
    if (status) query.status = status;

    return OfferModel.find(query)
      .populate('job')
      .populate('freelancer', 'name email profilePicUrl')
      .sort({ createdAt: -1 })
      .exec();
  }

  static async findByJob(jobId: Types.ObjectId): Promise<Offer[]> {
    return OfferModel.find({ job: jobId })
      .populate('business', 'name email profilePicUrl')
      .populate('freelancer', 'name email profilePicUrl')
      .sort({ createdAt: -1 })
      .exec();
  }

  static async updateStatus(
    id: Types.ObjectId,
    status: OfferStatus,
  ): Promise<Offer | null> {
    return OfferModel.findByIdAndUpdate(
      { _id: id },
      {
        status,
        updatedAt: new Date(),
      },
      { new: true },
    )
      .populate({
        path: 'job',
        populate: {
          path: 'skills',
          select: '_id name',
        },
      })
      .populate('user', 'name email profilePicUrl companyName')
      .populate('freelancer', 'name email profilePicUrl')
      .exec();
  }

  static async exists(
    jobId: Types.ObjectId,
    freelancerId: Types.ObjectId,
  ): Promise<boolean> {
    const offer = await OfferModel.exists({
      job: jobId,
      freelancer: freelancerId,
      status: OfferStatus.PENDING,
    });
    return offer !== null && offer !== undefined;
  }

  static async findByJobAndFreelancer(
    jobId: Types.ObjectId,
    freelancerId: Types.ObjectId,
  ): Promise<Offer | null> {
    return OfferModel.findOne({
      job: jobId,
      freelancer: freelancerId,
      status: OfferStatus.PENDING,
    })
      .populate('job')
      .populate('user', 'name email profilePicUrl')
      .populate('freelancer', 'name email profilePicUrl')
      .exec();
  }
}
