import { Router } from 'express';
import rateLimit from 'express-rate-limit';
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

// stricter limits for OTP / auth endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 5, // limit each IP to 5 requests per windowMs for sensitive endpoints (OTP / reset)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

router.post('/worker/register', registerWorker);
router.post('/worker/login', loginWorker);
router.post('/doctor/register', registerDoctor);
router.post('/doctor/login', loginDoctor);
router.post('/admin/register', registerAdmin);
router.post('/admin/login', loginAdmin);

// Twilio OTP & Forgot Password endpoints — apply strict limiter
router.post('/send-otp', authLimiter, sendOtp);
router.post('/verify-otp-login', authLimiter, verifyOtpLogin);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPasswordWithOtp);

export default router;
