import { HTTP_STATUS } from '../constants/http.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { serializeUser, serializeUsers } from '../utils/userSerializer.js';

export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('name username email role avatar bio').sort({ createdAt: -1 });
  return sendSuccess(res, HTTP_STATUS.OK, { users: serializeUsers(users) });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const { userId } = req.validated.params;
  const { role } = req.validated.body;

  if (String(req.user.id) === String(userId) && role !== 'admin') {
    throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Admins cannot demote themselves');
  }

  const user = await User.findByIdAndUpdate(userId, { role }, { new: true }).select('-passwordHash');
  if (!user) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, 'User not found');
  }

  return sendSuccess(res, HTTP_STATUS.OK, { user: serializeUser(user) });
});
