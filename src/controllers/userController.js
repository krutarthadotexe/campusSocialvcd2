import mongoose from 'mongoose';
import { HTTP_STATUS } from '../constants/http.js';
import { Follow } from '../models/Follow.js';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { createNotification } from '../services/notificationService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { serializeUser, serializeUsers } from '../utils/userSerializer.js';

export const getProfile = asyncHandler(async (req, res) => {
  const profile = await User.findOne({ username: req.params.username.toLowerCase() }).select('-passwordHash');
  if (!profile) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, 'User not found');
  }

  const viewerId = req.user?.id;
  let followStatus = 'none';
  if (viewerId && String(viewerId) !== String(profile.id)) {
    const follow = await Follow.findOne({ follower: viewerId, following: profile.id });
    followStatus = follow?.status || 'none';
  }

  return sendSuccess(res, HTTP_STATUS.OK, { user: serializeUser(profile), followStatus });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const updates = req.validated.body;
  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-passwordHash');
  return sendSuccess(res, HTTP_STATUS.OK, { user: serializeUser(user) });
});

export const updateAvatar = asyncHandler(async (req, res) => {
  const avatar = {
    filename: req.file.originalname,
    contentType: req.file.mimetype,
    sizeBytes: req.file.size,
    data: req.file.buffer
  };
  const user = await User.findByIdAndUpdate(req.user.id, { avatar }, { new: true }).select('-passwordHash');
  return sendSuccess(res, HTTP_STATUS.OK, { user: serializeUser(user) });
});

export const followUser = asyncHandler(async (req, res) => {
  const { userId } = req.validated.params;
  if (userId === req.user.id) {
    throw new AppError(HTTP_STATUS.BAD_REQUEST, 'You cannot follow yourself');
  }

  const target = await User.findById(userId);
  if (!target) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, 'User not found');
  }

  let follow = await Follow.findOne({ follower: req.user.id, following: userId });
  if (follow) {
    return sendSuccess(res, HTTP_STATUS.OK, { follow });
  }

  const status = target.isPrivate ? 'pending' : 'accepted';
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      [follow] = await Follow.create([{ follower: req.user.id, following: userId, status }], { session });

      if (status === 'accepted') {
        await User.findByIdAndUpdate(req.user.id, { $inc: { followingCount: 1 } }, { session });
        await User.findByIdAndUpdate(userId, { $inc: { followersCount: 1 } }, { session });
      }
    });
  } finally {
    await session.endSession();
  }

  if (status === 'accepted') {
    await createNotification({
      recipient: userId,
      actor: req.user.id,
      type: 'follow',
      entityType: 'user',
      entityId: req.user.id
    });
  }

  return sendSuccess(res, HTTP_STATUS.CREATED, { follow });
});

export const unfollowUser = asyncHandler(async (req, res) => {
  const { userId } = req.validated.params;
  const follow = await Follow.findOne({ follower: req.user.id, following: userId });
  if (!follow) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, 'Follow relationship not found');
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await Follow.deleteOne({ _id: follow.id }, { session });
      if (follow.status === 'accepted') {
        await User.findByIdAndUpdate(req.user.id, { $inc: { followingCount: -1 } }, { session });
        await User.findByIdAndUpdate(userId, { $inc: { followersCount: -1 } }, { session });
      }
    });
  } finally {
    await session.endSession();
  }

  return sendSuccess(res, HTTP_STATUS.OK, { message: 'Unfollowed successfully' });
});

export const listFollowers = asyncHandler(async (req, res) => {
  const followers = await Follow.find({ following: req.validated.params.userId, status: 'accepted' })
    .populate('follower', 'username name avatar')
    .sort({ createdAt: -1 });
  return sendSuccess(res, HTTP_STATUS.OK, {
    followers: serializeUsers(followers.map((entry) => entry.follower))
  });
});

export const listFollowing = asyncHandler(async (req, res) => {
  const following = await Follow.find({ follower: req.validated.params.userId, status: 'accepted' })
    .populate('following', 'username name avatar')
    .sort({ createdAt: -1 });
  return sendSuccess(res, HTTP_STATUS.OK, {
    following: serializeUsers(following.map((entry) => entry.following))
  });
});

export const searchUsers = asyncHandler(async (req, res) => {
  const { q, limit } = req.validated.query;
  const users = await User.find({ $text: { $search: q } })
    .select('username name avatar bio followersCount isPrivate')
    .limit(limit);
  const serializedUsers = serializeUsers(users);
  const userIds = serializedUsers.map((user) => user._id);
  const follows = await Follow.find({
    follower: req.user.id,
    following: { $in: userIds },
    status: 'accepted'
  }).select('following');
  const followingSet = new Set(follows.map((follow) => String(follow.following)));

  return sendSuccess(res, HTTP_STATUS.OK, {
    users: serializedUsers.map((user) => ({
      ...user,
      isFollowing: followingSet.has(String(user._id))
    }))
  });
});

export const getAvatar = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId).select('avatar');
  if (!user || !user.avatar?.data) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, 'Avatar not found');
  }

  res.setHeader('Content-Type', user.avatar.contentType);
  res.setHeader('Content-Length', user.avatar.sizeBytes);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  return res.send(user.avatar.data);
});
