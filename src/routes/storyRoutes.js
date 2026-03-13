import { Router } from 'express';
import {
  createStory,
  getStoryFeed,
  getStoryMedia,
  getStoryViewers,
  markStoryViewed
} from '../controllers/storyController.js';
import { requireAuth } from '../middleware/auth.js';
import { storyUpload } from '../middleware/upload.js';
import { validateRequest } from '../middleware/validate.js';
import { createStorySchema, storyIdParamSchema } from '../validators/storyValidators.js';

export const storyRouter = Router();

storyRouter.get('/feed', requireAuth, getStoryFeed);
storyRouter.post('/', requireAuth, storyUpload, validateRequest(createStorySchema), createStory);
storyRouter.get('/:storyId/media', getStoryMedia);
storyRouter.post('/:storyId/view', requireAuth, validateRequest(storyIdParamSchema), markStoryViewed);
storyRouter.get('/:storyId/viewers', requireAuth, validateRequest(storyIdParamSchema), getStoryViewers);
