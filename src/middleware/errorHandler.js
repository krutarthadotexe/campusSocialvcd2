import { ZodError } from 'zod';
import { HTTP_STATUS } from '../constants/http.js';
import { sendError } from '../utils/apiResponse.js';

export function notFoundHandler(req, res) {
  return sendError(res, HTTP_STATUS.NOT_FOUND, {
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ZodError) {
    return sendError(res, HTTP_STATUS.UNPROCESSABLE_ENTITY, {
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: err.flatten()
    });
  }

  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;

  return sendError(res, statusCode, {
    code: err.code || 'INTERNAL_SERVER_ERROR',
    message: err.message || 'Unexpected server error',
    details: err.details || null
  });
}
