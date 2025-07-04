import { authMiddleware } from '@/middlewares/auth';
import express from 'express';
import {
  register,
  verifyEmail,
  resendVerifyCode,
  login,
  forgotPassword,
  resetPassword,
  logout,
  verifyForgotPasswordCode,
} from '@/modules/auth/auth.controllers';
import {
  registerSchema,
  emailVerifySchema,
  loginSchema,
  verificationCodeSchema,
  resetPasswordSchema,
  verifyForgotPasswordCodeSchema,
} from '@/modules/auth/auth.dto';

import validator from '@/middlewares/validator';
const router = express.Router();

router.post('/register', validator(registerSchema), register);
router.post('/login', validator(loginSchema), login);
router.post('/verify-email', validator(verificationCodeSchema), verifyEmail);
router.post(
  '/resend-verify-code',
  validator(emailVerifySchema),
  resendVerifyCode,
);
router.post('/forgot-password', validator(emailVerifySchema), forgotPassword);

router.post(
  '/verify-forgot-password-code',
  validator(verifyForgotPasswordCodeSchema),
  verifyForgotPasswordCode,
);
router.post('/reset-password', validator(resetPasswordSchema), resetPassword);
router.post('/logout', authMiddleware, logout);

export default router;
