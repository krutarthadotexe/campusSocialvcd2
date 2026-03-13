import bcrypt from 'bcryptjs';
import { HTTP_STATUS } from '../constants/http.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/appError.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { serializeUser } from '../utils/userSerializer.js';

export async function registerUser(payload) {
  const existing = await User.findOne({
    $or: [{ email: payload.email.toLowerCase() }, { username: payload.username.toLowerCase() }]
  });

  if (existing) {
    throw new AppError(HTTP_STATUS.CONFLICT, 'Email or username already in use');
  }

  const passwordHash = await bcrypt.hash(payload.password, 12);
  const user = await User.create({
    email: payload.email,
    username: payload.username,
    passwordHash,
    name: payload.name
  });

  return buildAuthPayload(user);
}

export async function loginUser({ emailOrUsername, password }) {
  const user = await User.findOne({
    $or: [{ email: emailOrUsername.toLowerCase() }, { username: emailOrUsername.toLowerCase() }]
  });

  if (!user) {
    throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Invalid credentials');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Invalid credentials');
  }

  return buildAuthPayload(user);
}

export async function refreshSession(refreshToken) {
  if (!refreshToken) {
    throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Refresh token is required');
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Invalid or expired refresh token');
  }

  const user = await User.findById(payload.sub);
  if (!user || user.tokenVersion !== payload.tokenVersion) {
    throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Refresh token is no longer valid');
  }

  return buildAuthPayload(user);
}

export async function revokeRefreshTokens(userId) {
  await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });
}

function buildAuthPayload(user) {
  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id, user.tokenVersion);

  return {
    accessToken,
    refreshToken,
    user: sanitizeUser(user)
  };
}

export function sanitizeUser(user) {
  const serialized = serializeUser(user);

  return {
    id: serialized.id,
    email: serialized.email,
    username: serialized.username,
    name: serialized.name,
    bio: serialized.bio,
    avatar: serialized.avatar,
    isPrivate: serialized.isPrivate,
    followersCount: serialized.followersCount,
    followingCount: serialized.followingCount,
    postsCount: serialized.postsCount,
    createdAt: serialized.createdAt
  };
}
