import { ProtectedRequest } from 'app-request';
import express from 'express';
import { Types } from 'mongoose';
import authentication from '../auth/authentication';
import { BadRequestError, NotFoundError } from '../core/ApiError';
import { SuccessResponse } from '../core/ApiResponse';
import Subscription, {
  SubscriptionInterval,
  SubscriptionPlan,
} from '../database/model/Subscription';
import SubscriptionRepo from '../database/repository/SubscriptionRepo';
import UserRepo from '../database/repository/UserRepo';
import asyncHandler from '../helpers/asyncHandler';
import validator, { ValidationSource } from '../helpers/validator';
import schema from './schema';

const router = express.Router();

// All subscription routes need authentication
router.use(authentication);

/**
 * @swagger
 * /subscription:
 *   post:
 *     summary: Create a new subscription
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *       - apiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plan
 *               - interval
 *             properties:
 *               plan:
 *                 type: string
 *                 enum: [PRO, ENTERPRISE]
 *               interval:
 *                 type: string
 *                 enum: [MONTHLY, YEARLY]
 *     responses:
 *       200:
 *         description: Subscription created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  validator(schema.subscription.create),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { _id } = req.user;
    const userId = new Types.ObjectId(_id);

    // Check if user exists
    const user = await UserRepo.findById(userId);
    if (!user) throw new BadRequestError('User not registered');

    // Check if user already has an active subscription
    const existingSubscription =
      await SubscriptionRepo.findActiveByUserId(userId);
    if (existingSubscription) {
      throw new BadRequestError('User already has an active subscription');
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    if (req.body.interval === SubscriptionInterval.MONTHLY) {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // In a real application, you would calculate this based on the plan and interval
    // Here we're just setting some example prices
    let price = 0;
    if (req.body.plan === SubscriptionPlan.PRO) {
      price = req.body.interval === SubscriptionInterval.MONTHLY ? 9.99 : 99.99;
    } else if (req.body.plan === SubscriptionPlan.ENTERPRISE) {
      price =
        req.body.interval === SubscriptionInterval.MONTHLY ? 29.99 : 299.99;
    }

    // Create subscription object
    const subscription: Partial<Subscription> = {
      userId,
      plan: req.body.plan,
      interval: req.body.interval,
      startDate,
      endDate,
      price,
      autoRenew: true,
    };

    // Save subscription
    const createdSubscription = await SubscriptionRepo.create(
      subscription as Subscription,
    );

    return new SuccessResponse(
      'Subscription created successfully',
      createdSubscription,
    ).send(res);
  }),
);

/**
 * @swagger
 * /subscription:
 *   get:
 *     summary: Get user's active subscription
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *       - apiKey: []
 *     responses:
 *       200:
 *         description: Active subscription retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No active subscription found
 */
router.get(
  '/',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { _id } = req.user;
    const userId = new Types.ObjectId(_id);

    const subscription = await SubscriptionRepo.findActiveByUserId(userId);
    if (!subscription) throw new NotFoundError('No active subscription found');

    return new SuccessResponse(
      'Active subscription retrieved successfully',
      subscription,
    ).send(res);
  }),
);

/**
 * @swagger
 * /subscription/history:
 *   get:
 *     summary: Get user's subscription history
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *       - apiKey: []
 *     responses:
 *       200:
 *         description: Subscription history retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/history',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { _id } = req.user;
    const userId = new Types.ObjectId(_id);

    const subscriptions = await SubscriptionRepo.findAllByUserId(userId);

    return new SuccessResponse(
      'Subscription history retrieved successfully',
      subscriptions,
    ).send(res);
  }),
);

/**
 * @swagger
 * /subscription/{id}/cancel:
 *   patch:
 *     summary: Cancel a subscription
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *       - apiKey: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subscription cancelled successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Subscription not found
 */
router.patch(
  '/:id/cancel',
  validator(schema.subscription.id, ValidationSource.PARAM),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { _id } = req.user;
    const userId = new Types.ObjectId(_id);
    const subscriptionId = new Types.ObjectId(req.params.id);

    const cancelledSubscription = await SubscriptionRepo.cancelSubscription(
      subscriptionId,
      userId,
    );

    if (!cancelledSubscription)
      throw new NotFoundError('Subscription not found or already cancelled');

    return new SuccessResponse(
      'Subscription cancelled successfully',
      cancelledSubscription,
    ).send(res);
  }),
);

export default router;
