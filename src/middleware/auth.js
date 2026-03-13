import { HTTP_STATUS } from '../constants/http.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/appError.js';
import { verifyAccessToken } from '../utils/jwt.js';

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return next(new AppError(HTTP_STATUS.UNAUTHORIZED, 'Authentication required'));
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select('-passwordHash');

    if (!user) {
      return next(new AppError(HTTP_STATUS.UNAUTHORIZED, 'User not found'));
    }

    req.user = user;
    return next();
  } catch {
    return next(new AppError(HTTP_STATUS.UNAUTHORIZED, 'Invalid or expired access token'));
  }
}

export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return next();
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select('-passwordHash');

    if (user) {
      req.user = user;
    }
  } catch {
    // Ignore invalid optional auth and continue as anonymous.
  }

  return next();
}
