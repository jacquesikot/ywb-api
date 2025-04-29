import express from 'express';
import apiKey from '../auth/apiKey';
import { Permission } from '../database/model/ApiKey';
import permission from '../helpers/permission';
import login from './access/login';
import logout from './access/logout';
import signup from './access/signup';
import verifyEmail from './access/verifyEmail';
import forgotPassword from './access/forgotPassword';
import resetPassword from './access/resetPassword';
import googleLoginTest from './access/googleLoginTest';
import adminApiKey from './admin/adminApiKey';
import adminKYC from './admin/adminKYC';
import role from './admin/role';
import skill from './admin/skill';
import chat from './chat';
import dashboard from './dashboard';
import favorite from './favorite';
import job from './job';
import kyc from './kyc';
import message from './message';
import notification from './notification';
import subscription from './subscription';
import user from './user';
import wave from './wave';

const router = express.Router();
router.use('/reset-password', resetPassword);
router.use('/test-google-login', googleLoginTest);
router.use('/login', login);

// Apply the API Key middleware globally
router.use(apiKey);

// Public routes
router.use('/signup', permission(Permission.GENERAL), signup);
router.use('/verify-email', permission(Permission.GENERAL), verifyEmail);
router.use('/forgot-password', permission(Permission.GENERAL), forgotPassword);

// Protected routes for general users
router.use('/logout', permission(Permission.GENERAL), logout);
router.use('/user', permission(Permission.GENERAL), user);
router.use('/wave', permission(Permission.GENERAL), wave);
router.use('/chat', permission(Permission.GENERAL), chat);
router.use('/message', permission(Permission.GENERAL), message);
router.use('/notification', permission(Permission.GENERAL), notification);
router.use('/dashboard', permission(Permission.GENERAL), dashboard);
router.use('/job', permission(Permission.GENERAL), job);
router.use(
  '/education',
  permission(Permission.GENERAL),
  require('./education').default,
);
router.use('/favorite', permission(Permission.GENERAL), favorite);
router.use('/kyc', permission(Permission.GENERAL), kyc);
router.use('/subscription', permission(Permission.GENERAL), subscription);

// Admin routes
router.use('/admin/apiKey', permission(Permission.ADMIN), adminApiKey);
router.use('/admin/role', permission(Permission.ADMIN), role);
router.use('/admin/skill', permission(Permission.ADMIN), skill);
router.use('/admin/kyc', permission(Permission.ADMIN), adminKYC);

export default router;
