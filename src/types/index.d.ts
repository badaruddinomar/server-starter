// src/types/express/index.d.ts
import { JwtPayload } from 'jsonwebtoken';
import { User } from '@/generated/prisma';
declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload | User;
  }
}
