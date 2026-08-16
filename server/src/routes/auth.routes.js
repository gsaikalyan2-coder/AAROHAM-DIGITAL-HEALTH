import { Router } from 'express';
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

// Twilio OTP & Forgot Password endpoints
router.post('/send-otp', sendOtp);
router.post('/verify-otp-login', verifyOtpLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPasswordWithOtp);

export default router;
