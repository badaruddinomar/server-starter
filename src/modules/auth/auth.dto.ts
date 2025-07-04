import { z } from 'zod';

export const registerSchema = {
  body: z.object({
    name: z.string().min(1, 'Name is required').trim(),
    email: z
      .string()
      .email('Invalid email format')
      .trim()
      .transform((val) => val.toLowerCase()),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters long')
      .trim(),
    phone: z
      .string()
      .regex(/^(?:\+8801|01)[3-9]\d{8}$/, 'Invalid phone number')
      .trim()
      .optional(),
    address: z.string().min(1, 'Address is required').trim().optional(),
  }),
};
export type RegisterSchema = z.infer<typeof registerSchema.body>;

export const verificationCodeSchema = {
  body: z.object({
    verificationCode: z
      .string()
      .min(6, 'Verification code must be 6 characters long')
      .max(6, 'Verification code must be 6 characters long')
      .regex(/^\d+$/, 'Verification code must be numeric')
      .trim(),
  }),
};
export type VerificationCodeSchema = z.infer<
  typeof verificationCodeSchema.body
>;

export const loginSchema = {
  body: z.object({
    email: z.string().email('Invalid email format').trim(),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters long')
      .trim(),
  }),
};
export type LoginSchema = z.infer<typeof loginSchema.body>;

export const emailVerifySchema = {
  body: z.object({
    email: z.string().email('Invalid email format').trim(),
  }),
};
export type EmailVerifySchema = z.infer<typeof emailVerifySchema.body>;

export const verifyForgotPasswordCodeSchema = {
  body: z.object({
    forgotPasswordCode: z
      .string()
      .min(6, 'code must be 6 characters long')
      .max(6, 'code must be 6 characters long')
      .regex(/^\d+$/, 'code must be numeric')
      .trim(),
    email: z.string().email('Invalid email format').trim(),
  }),
};
export type VerifyForgotPasswordCodeSchema = z.infer<
  typeof verifyForgotPasswordCodeSchema.body
>;

export const resetPasswordSchema = {
  body: z.object({
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters long')
      .trim(),
  }),
};
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema.body>;

// .regex(/^(?=.*[a-zA-Z])(?=.*\d)/, 'Password must include letters and numbers') // TODO: add this validation after api testing
