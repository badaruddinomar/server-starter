import { Request, Response, RequestHandler } from 'express';
import httpStatus from 'http-status';
import { AppError } from '@/utils/appError';
import { prisma } from '@/utils/prismaClient';
import { UploadedFile } from 'express-fileupload';
import {
  deleteSingleImage,
  uploadSingleImage,
} from '@/utils/cloudinaryImageUpload';
import bcryptjs from 'bcryptjs';
import { Prisma } from '@/generated/prisma';

export const getUserProfile: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError('User not authenticated', httpStatus.UNAUTHORIZED);
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      role: true,
      avatarUrl: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', httpStatus.NOT_FOUND);
  }

  // Send response to client
  res.status(httpStatus.OK).json({
    success: true,
    message: 'User profile retrieved successfully',
    data: user,
  });
};

export const getAllUsers: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  const { search, page, limit } = req.query;

  const pageNumber =
    parseInt(page as string) > 0 ? parseInt(page as string) : 1;
  const limitNumber =
    parseInt(limit as string) > 0 ? parseInt(limit as string) : 10;
  const skip = (pageNumber - 1) * limitNumber;
  const searchText = search as string;

  const searchFilter: Prisma.UserWhereInput = {
    isVerified: true,
    ...(searchText && {
      OR: [
        { name: { contains: searchText.trim(), mode: 'insensitive' } },
        { email: { contains: searchText.trim(), mode: 'insensitive' } },
      ],
    }),
  };
  // Get all users
  const users = await prisma.user.findMany({
    where: searchFilter,
    skip,
    take: limitNumber,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      role: true,
      avatarUrl: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  const totalUsers = await prisma.user.count({
    where: {
      isVerified: true,
    },
  });
  // Send response to client
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Users retrieved successfully',
    data: users,
    meta: {
      totalUsers,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(totalUsers / limitNumber),
    },
  });
};

export const updateUserProfile: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  const userId = req.user?.id;
  const { name, phone, address } = req.body;
  const avatar = req.files?.avatar as UploadedFile;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('User not found', httpStatus.NOT_FOUND);
  }

  let avatarObj: { url: string; public_id: string } | null = {
    url: user.avatarUrl || '',
    public_id: user.avatarUrlId || '',
  };
  // check is avatar exists--
  if (avatar) {
    // check avatar is more than one--
    if (Array.isArray(avatar)) {
      throw new AppError(
        'Only one image can be uploaded for avatar',
        httpStatus.BAD_REQUEST,
      );
    }
    // check avatar file type is valid---
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validImageTypes.includes(avatar.mimetype)) {
      throw new AppError(
        'Invalid image type, image must be jpeg, png or webp',
        httpStatus.BAD_REQUEST,
      );
    }
    // check avatar file size--
    const MAX_SIZE = 2 * 1024 * 1024;
    if (avatar.size > MAX_SIZE) {
      throw new AppError(
        'Image size must be less than 2MB',
        httpStatus.BAD_REQUEST,
      );
    }
    // Delete old avatar
    if (user.avatarUrlId) {
      await deleteSingleImage(user.avatarUrlId);
    }
    // upload new avatar--
    avatarObj = await uploadSingleImage(avatar, 'tohori_avatars');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name,
      phone,
      address,
      avatarUrl: avatarObj?.url,
      avatarUrlId: avatarObj?.public_id,
    },
  });
  const { password: _password, ...userData } = updatedUser;
  // Send response to client
  res.status(httpStatus.OK).json({
    success: true,
    message: 'User profile updated successfully',
    data: userData,
  });
};

export const deleteUser: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  const userId = req.params.id;
  const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
  if (!user) {
    throw new AppError('User not found', httpStatus.NOT_FOUND);
  }
  if (user.avatarUrlId) {
    await deleteSingleImage(user.avatarUrlId);
  }
  await prisma.user.delete({ where: { id: Number(userId) } });
  // Send response to client
  res.status(httpStatus.OK).json({
    success: true,
    message: 'User deleted successfully',
  });
};

export const changePassword: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  const userId = req.user?.id;
  const { currentPassword, newPassword } = req.body;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('User not found', httpStatus.NOT_FOUND);
  }

  const isMatch = await bcryptjs.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new AppError('Current password is incorrect', httpStatus.BAD_REQUEST);
  }

  const salt = await bcryptjs.genSalt(10);
  const hashedPassword = await bcryptjs.hash(newPassword, salt);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
  // Send response to client
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Password changed successfully',
  });
};
