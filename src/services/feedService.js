import mongoose from 'mongoose';
import { Follow } from '../models/Follow.js';
import { Post } from '../models/Post.js';
import { User } from '../models/User.js';
import { buildCursorMeta, decodeCursor } from '../utils/pagination.js';

export async function getHomeFeed({ userId, cursor, limit }) {
  const decoded = decodeCursor(cursor);
  const follows = await Follow.find({ follower: userId, status: 'accepted' }).select('following');
  const ownerIds = [userId, ...follows.map((entry) => entry.following)];
  const filter = { owner: { $in: ownerIds } };

  if (decoded) {
    filter.$or = [
      { createdAt: { $lt: new Date(decoded.createdAt) } },
      {
        createdAt: new Date(decoded.createdAt),
        _id: { $lt: new mongoose.Types.ObjectId(decoded.id) }
      }
    ];
  }

  const posts = await Post.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .populate('owner', 'username name avatar');

  return buildCursorMeta(posts, limit, (item) => ({
    id: item._id,
    createdAt: item.createdAt.toISOString()
  }));
}

export async function getDiscoverFeed({ userId, cursor, limit }) {
  const decoded = decodeCursor(cursor);
  const follows = await Follow.find({ follower: userId, status: 'accepted' }).select('following');
  const visibleOwnerIds = [userId, ...follows.map((entry) => entry.following)];

  const allowedUsers = await User.find({
    $or: [{ isPrivate: false }, { _id: { $in: visibleOwnerIds } }]
  }).select('_id');

  const filter = {
    owner: { $in: allowedUsers.map((user) => user._id) }
  };

  if (decoded) {
    filter.$or = [
      { createdAt: { $lt: new Date(decoded.createdAt) } },
      {
        createdAt: new Date(decoded.createdAt),
        _id: { $lt: new mongoose.Types.ObjectId(decoded.id) }
      }
    ];
  }

  const posts = await Post.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .populate('owner', 'username name avatar isPrivate');

  return buildCursorMeta(posts, limit, (item) => ({
    id: item._id,
    createdAt: item.createdAt.toISOString()
  }));
}
