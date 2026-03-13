import mongoose from 'mongoose';
import { HTTP_STATUS } from '../constants/http.js';
import { Comment } from '../models/Comment.js';
import { Like } from '../models/Like.js';
import { Notification } from '../models/Notification.js';
import { Post } from '../models/Post.js';
import { User } from '../models/User.js';
import { getDiscoverFeed, getHomeFeed } from '../services/feedService.js';
import { createNotification } from '../services/notificationService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { buildCursorMeta, decodeCursor } from '../utils/pagination.js';
import { serializePost, serializePosts } from '../utils/postSerializer.js';

async function attachLikedByMe(posts, userId) {
  const serializedPosts = Array.isArray(posts) ? serializePosts(posts) : [serializePost(posts)];
  const postIds = serializedPosts.map((post) => post._id);
  const likes = await Like.find({
    user: userId,
    targetType: 'post',
    targetId: { $in: postIds }
  }).select('targetId');
  const likedIds = new Set(likes.map((like) => String(like.targetId)));

  const annotated = serializedPosts.map((post) => ({
    ...post,
    likedByMe: likedIds.has(String(post._id))
  }));

  return Array.isArray(posts) ? annotated : annotated[0];
}

export const createPost = asyncHandler(async (req, res) => {
  const { body } = req.validated;
  const tags = Array.isArray(body.tags)
    ? body.tags
    : String(body.tags || '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
  const media = req.files.map((file) => ({
    filename: file.originalname,
    resourceType: file.mimetype.startsWith('video/') ? 'video' : 'image',
    contentType: file.mimetype,
    sizeBytes: file.size,
    duration: null,
    format: file.originalname.includes('.') ? file.originalname.split('.').at(-1).toLowerCase() : 'bin',
    data: file.buffer
  }));

  const post = await Post.create({
    owner: req.user.id,
    caption: body.caption,
    media,
    aspectRatio: body.aspectRatio,
    locationText: body.locationText || '',
    tags
  });

  await User.findByIdAndUpdate(req.user.id, { $inc: { postsCount: 1 } });
  return sendSuccess(res, HTTP_STATUS.CREATED, {
    post: {
      ...serializePost(post),
      likedByMe: false
    }
  });
});

export const getPost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.validated.params.postId).populate('owner', 'username name avatar');
  if (!post) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, 'Post not found');
  }

  return sendSuccess(res, HTTP_STATUS.OK, { post: await attachLikedByMe(post, req.user.id) });
});

export const updatePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.validated.params.postId).populate('owner', 'username name avatar');
  if (!post) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, 'Post not found');
  }
  if (String(post.owner._id || post.owner) !== String(req.user.id)) {
    throw new AppError(HTTP_STATUS.FORBIDDEN, 'You do not have permission to edit this post');
  }

  const { caption, aspectRatio, locationText, tags } = req.validated.body;
  if (caption !== undefined) {
    post.caption = caption;
  }
  if (aspectRatio !== undefined) {
    post.aspectRatio = aspectRatio;
  }
  if (locationText !== undefined) {
    post.locationText = locationText;
  }
  if (tags !== undefined) {
    post.tags = Array.isArray(tags)
      ? tags
      : String(tags)
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean);
  }

  await post.save();
  await post.populate('owner', 'username name avatar');
  return sendSuccess(res, HTTP_STATUS.OK, { post: await attachLikedByMe(post, req.user.id) });
});

export const listUserPosts = asyncHandler(async (req, res) => {
  const { userId } = req.validated.params;
  const { cursor, limit } = req.validated.query;
  const decoded = decodeCursor(cursor);
  const filter = { owner: userId };

  if (decoded) {
    filter.$or = [
      { createdAt: { $lt: new Date(decoded.createdAt) } },
      { createdAt: new Date(decoded.createdAt), _id: { $lt: new mongoose.Types.ObjectId(decoded.id) } }
    ];
  }

  const posts = await Post.find(filter).sort({ createdAt: -1, _id: -1 }).limit(limit + 1);
  const { items, meta } = buildCursorMeta(posts, limit, (item) => ({
    id: item._id,
    createdAt: item.createdAt.toISOString()
  }));

  return sendSuccess(res, HTTP_STATUS.OK, { posts: await attachLikedByMe(items, req.user.id) }, meta);
});

export const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.validated.params.postId);
  if (!post) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, 'Post not found');
  }
  if (String(post.owner) !== String(req.user.id)) {
    throw new AppError(HTTP_STATUS.FORBIDDEN, 'You do not have permission to delete this post');
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await Post.deleteOne({ _id: post.id }, { session });
      await Comment.deleteMany({ post: post.id }, { session });
      await Like.deleteMany({ targetType: 'post', targetId: post.id }, { session });
      await Notification.deleteMany({ entityType: 'post', entityId: post.id }, { session });
      await User.findByIdAndUpdate(req.user.id, { $inc: { postsCount: -1 } }, { session });
    });
  } finally {
    await session.endSession();
  }

  return sendSuccess(res, HTTP_STATUS.OK, { message: 'Post deleted successfully' });
});

export const likePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.validated.params.postId);
  if (!post) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, 'Post not found');
  }

  const existing = await Like.findOne({ user: req.user.id, targetType: 'post', targetId: post.id });
  if (existing) {
    return sendSuccess(res, HTTP_STATUS.OK, { liked: true });
  }

  await Like.create({ user: req.user.id, targetType: 'post', targetId: post.id });
  await Post.findByIdAndUpdate(post.id, { $inc: { likesCount: 1 } });
  await createNotification({
    recipient: post.owner,
    actor: req.user.id,
    type: 'post_like',
    entityType: 'post',
    entityId: post.id
  });

  return sendSuccess(res, HTTP_STATUS.CREATED, { liked: true });
});

export const unlikePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.validated.params.postId);
  if (!post) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, 'Post not found');
  }

  const deleted = await Like.findOneAndDelete({ user: req.user.id, targetType: 'post', targetId: post.id });
  if (deleted) {
    await Post.findByIdAndUpdate(post.id, { $inc: { likesCount: -1 } });
  }

  return sendSuccess(res, HTTP_STATUS.OK, { liked: false });
});

export const getFeed = asyncHandler(async (req, res) => {
  const { items, meta } = await getHomeFeed({
    userId: req.user.id,
    cursor: req.validated.query.cursor,
    limit: req.validated.query.limit
  });

  return sendSuccess(res, HTTP_STATUS.OK, { posts: await attachLikedByMe(items, req.user.id) }, meta);
});

export const getDiscoverPosts = asyncHandler(async (req, res) => {
  const { items, meta } = await getDiscoverFeed({
    userId: req.user.id,
    cursor: req.validated.query.cursor,
    limit: req.validated.query.limit
  });

  return sendSuccess(res, HTTP_STATUS.OK, { posts: await attachLikedByMe(items, req.user.id) }, meta);
});

export const getPostMedia = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.postId).select('media');
  if (!post) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, 'Post not found');
  }

  const index = Number(req.params.mediaIndex);
  const media = post.media[index];
  if (!media) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, 'Media not found');
  }

  res.setHeader('Content-Type', media.contentType);
  res.setHeader('Content-Length', media.sizeBytes);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  return res.send(media.data);
});
