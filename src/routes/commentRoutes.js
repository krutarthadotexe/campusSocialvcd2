import { Router } from 'express';
import {
  createComment,
  deleteComment,
  likeComment,
  listComments,
  unlikeComment
} from '../controllers/commentController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { commentIdParamSchema, createCommentSchema, listCommentsSchema } from '../validators/commentValidators.js';

export const commentRouter = Router();

commentRouter.post('/posts/:postId/comments', requireAuth, validateRequest(createCommentSchema), createComment);
commentRouter.get('/posts/:postId/comments', requireAuth, validateRequest(listCommentsSchema), listComments);
commentRouter.delete('/comments/:commentId', requireAuth, validateRequest(commentIdParamSchema), deleteComment);
commentRouter.post('/comments/:commentId/like', requireAuth, validateRequest(commentIdParamSchema), likeComment);
commentRouter.delete('/comments/:commentId/like', requireAuth, validateRequest(commentIdParamSchema), unlikeComment);
