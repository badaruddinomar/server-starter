import { RequestHandler, Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import httpStatus from 'http-status';

type Schemas = {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
};

const validator = (schemas: Schemas): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const errors: Record<string, unknown> = {};

    //  Validate body
    if (schemas.body) {
      const bodyResult = await schemas.body.safeParseAsync(req.body);
      if (!bodyResult.success) {
        errors.body = bodyResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
      } else {
        req.body = bodyResult.data;
      }
    }

    // Validate query
    if (schemas.query) {
      const queryResult = await schemas.query.safeParseAsync(req.query);
      if (!queryResult.success) {
        errors.query = queryResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
      } else {
        req.query = queryResult.data;
      }
    }

    // Validate params
    if (schemas.params) {
      const paramsResult = await schemas.params.safeParseAsync(req.params);
      if (!paramsResult.success) {
        errors.params = paramsResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
      } else {
        req.params = paramsResult.data;
      }
    }

    //  If any errors, respond with 400
    if (Object.keys(errors).length > 0) {
      res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: 'VALIDATION FAILED',
        errors: errors,
      });
      return;
    }

    next();
  };
};

export default validator;
