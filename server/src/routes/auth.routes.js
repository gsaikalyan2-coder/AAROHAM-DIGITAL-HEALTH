import { Router } from 'express';
import { authLimiter } from '../middleware/rateLimiter.js';
import {
  registerWorker,
  loginWorker,
  registerDoctor,
  loginDoctor,
  registerAdmin,
  loginAdmin,
  sendOtp,
  verifyOtpLogin,
  forgotPassword,
  resetPasswordWithOtp,
} from '../controllers/auth.controller.js';

const router = Router();

router.post('/worker/register', registerWorker);
router.post('/worker/login', loginWorker);
router.post('/doctor/register', registerDoctor);
router.post('/doctor/login', loginDoctor);
router.post('/admin/register', registerAdmin);
router.post('/admin/login', loginAdmin);

// Twilio OTP & Forgot Password endpoints — apply strict Redis-backed limiter
router.post('/send-otp', authLimiter, sendOtp);
router.post('/verify-otp-login', authLimiter, verifyOtpLogin);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPasswordWithOtp);

export default router;
