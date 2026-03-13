import { Router } from 'express';
import {
  followUser,
  getAvatar,
  getProfile,
  listFollowers,
  listFollowing,
  searchUsers,
  unfollowUser,
  updateAvatar,
  updateProfile
} from '../controllers/userController.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { avatarUpload } from '../middleware/upload.js';
import { validateRequest } from '../middleware/validate.js';
import { searchUsersSchema, updateAvatarSchema, updateProfileSchema, userIdParamSchema } from '../validators/userValidators.js';

export const userRouter = Router();

userRouter.get('/search', requireAuth, validateRequest(searchUsersSchema), searchUsers);
userRouter.get('/:userId/avatar', getAvatar);
userRouter.get('/:username', optionalAuth, getProfile);
userRouter.patch('/me', requireAuth, validateRequest(updateProfileSchema), updateProfile);
userRouter.put('/me/avatar', requireAuth, avatarUpload, validateRequest(updateAvatarSchema), updateAvatar);
userRouter.post('/:userId/follow', requireAuth, validateRequest(userIdParamSchema), followUser);
userRouter.delete('/:userId/follow', requireAuth, validateRequest(userIdParamSchema), unfollowUser);
userRouter.get('/:userId/followers', requireAuth, validateRequest(userIdParamSchema), listFollowers);
userRouter.get('/:userId/following', requireAuth, validateRequest(userIdParamSchema), listFollowing);
