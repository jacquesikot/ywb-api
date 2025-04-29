import express from 'express';
import { google } from '../../config';
import asyncHandler from '../../helpers/asyncHandler';
import { PublicRequest } from '../../types/app-request';

const router = express.Router();

/**
 * @swagger
 * /test-google-login:
 *   get:
 *     summary: Test page for Google login
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: HTML page for testing Google login
 */
router.get(
  '/',
  asyncHandler(async (req: PublicRequest, res) => {
    // Log the client ID for debugging
    console.log('Google Client ID being used:', google.clientId);
    
    return res.render('google-login', {
      googleClientId: google.clientId || '',
      // Add debug info to help troubleshoot
      debugInfo: {
        hasClientId: !!google.clientId,
        clientIdLength: google.clientId ? google.clientId.length : 0
      }
    });
  }),
);

export default router;
