import { Request, Response, RequestHandler, NextFunction } from 'express';
import { AppError } from '@/utils/appError';
import bcryptjs from 'bcryptjs';
import httpStatus from 'http-status';
import sendEmail from '@/utils/sendEmail';
import {
  verifyEmailTemplate,
  forgotPasswordEmailTemplate,
} from '@/templates/emailTemplate';
import { prisma } from '@/utils/prismaClient';
import { User } from '@/generated/prisma';
import jwt, { JwtPayload } from 'jsonwebtoken';
import config from '@/config';
import { createCookie } from '@/utils/createCookie';
import asyncHandler from '@/utils/asyncHandler';

export const register: RequestHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { name, email, password } = req.body;
    // check if user exists--
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (user) {
      throw new AppError('User already exists', httpStatus.BAD_REQUEST);
    }

    // hash password--
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    // create verify token--
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const verifyCodeExpire = new Date(Date.now() + 1 * 60 * 1000); // 1 min from now

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        verifyCode: verificationCode,
        verifyCodeExpire,
      },
    });

    // send verification email--
    await sendEmail({
      reciverEmail: newUser.email,
      subject: 'Verify your email',
      body: verifyEmailTemplate(verificationCode),
    });
    // send response to client--
    const {
      password: _password,
      verifyCode: _verifyCode,
      verifyCodeExpire: _verifyCodeExpire,
      forgotPasswordCode: _forgotPasswordCode,
      forgotPasswordCodeExpire: _forgotPasswordCodeExpire,
      ...userData
    } = newUser;
    res.status(httpStatus.CREATED).json({
      success: true,
      message: 'user registered successfully',
      data: userData,
    });
  },
);
export const verifyEmail: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  const { verificationCode } = req.body;
  // 1. Check if the verification code is valid and not expired
  const user = await prisma.user.findFirst({
    where: {
      verifyCode: verificationCode,
      verifyCodeExpire: {
        gt: new Date(),
      },
    },
  });

  // if not valid--
  if (!user) {
    throw new AppError('Invalid code', httpStatus.BAD_REQUEST);
  }
  // 3. Update the user as verified and clear the verification fields
  await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      verifyCode: null,
      verifyCodeExpire: null,
    },
  });
  // send response to client--
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Email verified successfully',
  });
};
export const resendVerifyCode = async (req: Request, res: Response) => {
  const { email } = req.body;

  // Check if user exists in the database
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError(
      'User with this email does not exist!',
      httpStatus.NOT_FOUND,
    );
  }

  if (user.isVerified) {
    throw new AppError('Email is already verified!', httpStatus.BAD_REQUEST);
  }

  // Generate a new verification code
  const newVerificationCode = Math.floor(
    100000 + Math.random() * 900000,
  ).toString();
  const newVerifyCodeExpire = new Date(Date.now() + 1 * 60 * 1000);

  // Update user with the new verification code and expiry time
  await prisma.user.update({
    where: { email },
    data: {
      verifyCode: newVerificationCode,
      verifyCodeExpire: newVerifyCodeExpire,
    },
  });

  // Send the verification email
  await sendEmail({
    reciverEmail: user.email,
    subject: 'Resend Verify Code',
    body: verifyEmailTemplate(newVerificationCode),
  });

  // Respond to the client
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Verification code has been resent. Please check your email.',
  });
};
export const login: RequestHandler = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  // 1. Check if user exists
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError('Invalid credentials', httpStatus.BAD_REQUEST);
  }
  // compare the password--
  const isMatch = await bcryptjs.compare(password, user.password);
  if (!isMatch) {
    throw new AppError('Invalid credentials', httpStatus.BAD_REQUEST);
  }
  if (!user.isVerified) {
    throw new AppError('Please verify your email', httpStatus.UNAUTHORIZED);
  }

  // Send response to client (exclude password)
  const {
    password: _password,
    verifyCode: _verifyCode,
    verifyCodeExpire: _verifyCodeExpire,
    forgotPasswordCode: _forgotPasswordCode,
    forgotPasswordCodeExpire: _forgotPasswordCodeExpire,
    ...userData
  } = user;
  createCookie(res, user as User);
  res.status(httpStatus.OK).json({
    success: true,
    message: 'user logged in successfully',
    data: userData,
  });
};

export const forgotPassword: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  const { email } = req.body;

  // 1. Check if user exists
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError('User not found', httpStatus.BAD_REQUEST);
  }

  // 2. Generate code and expiry
  const forgotPasswordCode = Math.floor(
    100000 + Math.random() * 900000,
  ).toString();
  const forgotPasswordCodeExpire = new Date(Date.now() + 1 * 60 * 1000); // 1 mins

  // 3. Update user in DB
  await prisma.user.update({
    where: { email },
    data: {
      forgotPasswordCode,
      forgotPasswordCodeExpire,
    },
  });

  await sendEmail({
    reciverEmail: email,
    subject: 'Reset your password',
    body: forgotPasswordEmailTemplate(forgotPasswordCode),
  });

  // 5. Respond to client
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Password reset email sent successfully',
  });
};

export const verifyForgotPasswordCode: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  const { email, forgotPasswordCode } = req.body;

  const user = await prisma.user.findFirst({
    where: {
      email,
      forgotPasswordCode,
      forgotPasswordCodeExpire: { gt: new Date() },
    },
  });

  if (!user) {
    throw new AppError('Invalid code', httpStatus.BAD_REQUEST);
  }

  // Issue a short-lived reset token (expires in e.g., 10 mins)
  const resetToken = jwt.sign(
    { userId: user.id, type: 'RESET_PASSWORD' },
    config.jwt_secret,
    {
      expiresIn: '10m',
    },
  );

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Code verified successfully',
    meta: {
      resetToken,
    },
  });
};
export const resetPassword: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  const { password } = req.body;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    throw new AppError('Reset token required', httpStatus.BAD_REQUEST);
  }

  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, config.jwt_secret) as JwtPayload;
  } catch {
    throw new AppError('Invalid token', httpStatus.BAD_REQUEST);
  }

  if (payload.type !== 'RESET_PASSWORD') {
    throw new AppError('Invalid token', httpStatus.BAD_REQUEST);
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });
  if (!user) {
    throw new AppError('User not found', httpStatus.BAD_REQUEST);
  }

  // 2. Hash the new password
  const salt = await bcryptjs.genSalt(10);
  const hashedPassword = await bcryptjs.hash(password, salt);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      forgotPasswordCode: null,
      forgotPasswordCodeExpire: null,
    },
  });

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Password reset successfully',
  });
};

export const logout: RequestHandler = async (_req: Request, res: Response) => {
  res.clearCookie('token');
  res.status(httpStatus.OK).json({
    success: true,
    message: 'user logged out successfully',
  });
};
