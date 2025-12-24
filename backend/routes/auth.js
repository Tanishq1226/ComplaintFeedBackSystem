import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { signup, login, getMe, verifyOtp, resendOtp } from '../controllers/authController.js';

const router = express.Router();

// Signup
router.post('/signup', signup);

// Login
router.post('/login', login);

// OTP Verification
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);

// Get current user
router.get('/me', authenticate, getMe);

export default router;
