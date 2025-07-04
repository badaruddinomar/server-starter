import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AppError } from '@/utils/appError';
import jwt, { JwtPayload } from 'jsonwebtoken';
import config from '@/config';
import httpStatus from 'http-status';
import { User, UserRole } from '@/generated/prisma';
import { prisma } from '@/utils/prismaClient';

export const authMiddleware: RequestHandler = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const token = req.cookies.token;

  if (!token) {
    throw new AppError(
      'Please login to access this resource.',
      httpStatus.UNAUTHORIZED,
    );
  }

  const decodedData = jwt.verify(token, config.jwt_secret) as JwtPayload;

  const user = await prisma.user.findUnique({
    where: { id: decodedData?.userId },
  });

  if (!user) {
    throw new AppError(
      'User no longer exists. Please login again.',
      httpStatus.UNAUTHORIZED,
    );
  }

  if (!user.isVerified) {
    throw new AppError('Please verify your email.', httpStatus.UNAUTHORIZED);
  }

  req.user = user as User;
  next();
};
// Authorize Roles--
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role as UserRole)) {
      throw new AppError(
        `Role ${req.user?.role} is not allowed to access this resource.`,
        httpStatus.FORBIDDEN,
      );
    }
    next();
  };
};
