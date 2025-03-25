import express from 'express';
import apiKey from '../auth/apiKey';
import { Permission } from '../database/model/ApiKey';
import permission from '../helpers/permission';
import login from './access/login';
import logout from './access/logout';
import signup from './access/signup';
import verifyEmail from './access/verifyEmail';
import adminApiKey from './admin/adminApiKey';
import role from './admin/role';
import skill from './admin/skill';
import chat from './chat';
import dashboard from './dashboard';
import job from './job';
import message from './message';
import notification from './notification';
import user from './user';
import wave from './wave';

const router = express.Router();

// Apply the API Key middleware globally
router.use(apiKey);

// Public routes
router.use('/signup', permission(Permission.GENERAL), signup);
router.use('/login', permission(Permission.GENERAL), login);
router.use('/verify-email', permission(Permission.GENERAL), verifyEmail);

// Protected routes for general users
router.use('/logout', permission(Permission.GENERAL), logout);
router.use('/user', permission(Permission.GENERAL), user);
router.use('/wave', permission(Permission.GENERAL), wave);
router.use('/chat', permission(Permission.GENERAL), chat);
router.use('/message', permission(Permission.GENERAL), message);
router.use('/notification', permission(Permission.GENERAL), notification);
router.use('/dashboard', permission(Permission.GENERAL), dashboard);
router.use('/job', permission(Permission.GENERAL), job);

// Admin routes
router.use('/admin/apiKey', permission(Permission.ADMIN), adminApiKey);
router.use('/admin/role', permission(Permission.ADMIN), role);
router.use('/admin/skill', permission(Permission.ADMIN), skill);

export default router;
