import { HTTP_STATUS } from '../constants/http.js';
import { Comment } from '../models/Comment.js';
import { Like } from '../models/Like.js';
import { Post } from '../models/Post.js';
import { createNotification } from '../services/notificationService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { serializeComment, serializeComments } from '../utils/commentSerializer.js';
import { buildCursorMeta, decodeCursor } from '../utils/pagination.js';
import { sanitizeUser } from '../services/authService.js';

export const createComment = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.validated.params.postId);
  if (!post) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, 'Post not found');
  }

  const comment = await Comment.create({
    post: post.id,
    author: req.user.id,
    body: req.validated.body.body,
    parentComment: req.validated.body.parentComment || null
  });

  await Post.findByIdAndUpdate(post.id, { $inc: { commentsCount: 1 } });
  await createNotification({
    recipient: post.owner,
    actor: req.user.id,
    type: 'comment',
    entityType: 'comment',
    entityId: comment.id
  });

  return sendSuccess(res, HTTP_STATUS.CREATED, {
    comment: serializeComment({
      ...comment.toObject(),
      author: sanitizeUser(req.user)
    })
  });
});

export const listComments = asyncHandler(async (req, res) => {
  const { cursor, limit } = req.validated.query;
  const filter = { post: req.validated.params.postId };
  const decoded = decodeCursor(cursor);

  if (decoded) {
    filter.$or = [
      { createdAt: { $lt: new Date(decoded.createdAt) } },
      { createdAt: new Date(decoded.createdAt), _id: { $lt: decoded.id } }
    ];
  }

  const comments = await Comment.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .populate('author', 'username name avatar');
  const { items, meta } = buildCursorMeta(comments, limit, (item) => ({
    id: item._id,
    createdAt: item.createdAt.toISOString()
  }));

  return sendSuccess(res, HTTP_STATUS.OK, { comments: serializeComments(items) }, meta);
});

export const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.validated.params.commentId);
  if (!comment) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, 'Comment not found');
  }
  if (String(comment.author) !== String(req.user.id)) {
    throw new AppError(HTTP_STATUS.FORBIDDEN, 'You do not have permission to delete this comment');
  }

  await Comment.deleteOne({ _id: comment.id });
  await Post.findByIdAndUpdate(comment.post, { $inc: { commentsCount: -1 } });
  await Like.deleteMany({ targetType: 'comment', targetId: comment.id });

  return sendSuccess(res, HTTP_STATUS.OK, { message: 'Comment deleted successfully' });
});

export const likeComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.validated.params.commentId);
  if (!comment) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, 'Comment not found');
  }

  const existing = await Like.findOne({ user: req.user.id, targetType: 'comment', targetId: comment.id });
  if (existing) {
    return sendSuccess(res, HTTP_STATUS.OK, { liked: true });
  }

  await Like.create({ user: req.user.id, targetType: 'comment', targetId: comment.id });
  await Comment.findByIdAndUpdate(comment.id, { $inc: { likesCount: 1 } });
  await createNotification({
    recipient: comment.author,
    actor: req.user.id,
    type: 'comment_like',
    entityType: 'comment',
    entityId: comment.id
  });

  return sendSuccess(res, HTTP_STATUS.CREATED, { liked: true });
});

export const unlikeComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.validated.params.commentId);
  if (!comment) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, 'Comment not found');
  }

  const deleted = await Like.findOneAndDelete({ user: req.user.id, targetType: 'comment', targetId: comment.id });
  if (deleted) {
    await Comment.findByIdAndUpdate(comment.id, { $inc: { likesCount: -1 } });
  }

  return sendSuccess(res, HTTP_STATUS.OK, { liked: false });
});
