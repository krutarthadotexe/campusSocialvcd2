import { Router } from 'express';
import {
  createPost,
  deletePost,
  getDiscoverPosts,
  getFeed,
  getPostMedia,
  getPost,
  likePost,
  listUserPosts,
  updatePost,
  unlikePost
} from '../controllers/postController.js';
import { requireAuth } from '../middleware/auth.js';
import { postMediaUpload } from '../middleware/upload.js';
import { validateRequest } from '../middleware/validate.js';
import { createPostSchema, discoverFeedSchema, feedSchema, listPostsSchema, postIdParamSchema, updatePostSchema } from '../validators/postValidators.js';

export const postRouter = Router();

postRouter.get('/feed', requireAuth, validateRequest(feedSchema), getFeed);
postRouter.get('/discover', requireAuth, validateRequest(discoverFeedSchema), getDiscoverPosts);
postRouter.post('/', requireAuth, postMediaUpload, validateRequest(createPostSchema), createPost);
postRouter.get('/user/:userId', requireAuth, validateRequest(listPostsSchema), listUserPosts);
postRouter.get('/:postId/media/:mediaIndex', getPostMedia);
postRouter.get('/:postId', requireAuth, validateRequest(postIdParamSchema), getPost);
postRouter.patch('/:postId', requireAuth, validateRequest(updatePostSchema), updatePost);
postRouter.delete('/:postId', requireAuth, validateRequest(postIdParamSchema), deletePost);
postRouter.post('/:postId/like', requireAuth, validateRequest(postIdParamSchema), likePost);
postRouter.delete('/:postId/like', requireAuth, validateRequest(postIdParamSchema), unlikePost);
