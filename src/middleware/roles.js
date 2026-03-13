import { HTTP_STATUS } from '../constants/http.js';
import { AppError } from '../utils/appError.js';

export function requireRole(...allowedRoles) {
  return function roleGuard(req, res, next) {
    if (!req.user) {
      return next(new AppError(HTTP_STATUS.UNAUTHORIZED, 'Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError(HTTP_STATUS.FORBIDDEN, 'You do not have permission to perform this action'));
    }

    return next();
  };
}
