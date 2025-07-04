import express from 'express';
import { authorizeRoles, authMiddleware } from '@/middlewares/auth';
import {
  changePassword,
  deleteUser,
  getAllUsers,
  getUserProfile,
  updateUserProfile,
} from '@/modules/user/user.controllers';
import validator from '@/middlewares/validator';
import {
  changePasswordSchema,
  updateUserProfileSchema,
} from '@/modules/user/user.dto';

const router = express.Router();
router.get('/profile', authMiddleware, getUserProfile);
router.get('/list', authMiddleware, authorizeRoles('ADMIN'), getAllUsers);
router.patch(
  '/update',
  authMiddleware,
  validator(updateUserProfileSchema),
  updateUserProfile,
);
router.delete(
  '/delete/:id',
  authMiddleware,
  authorizeRoles('ADMIN'),
  deleteUser,
);
router.patch(
  '/change-password',
  authMiddleware,
  validator(changePasswordSchema),
  changePassword,
);

export default router;
