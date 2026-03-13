import { Router } from 'express';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { listNotificationsSchema, notificationIdParamSchema } from '../validators/notificationValidators.js';

export const notificationRouter = Router();

notificationRouter.get('/', requireAuth, validateRequest(listNotificationsSchema), listNotifications);
notificationRouter.post('/read-all', requireAuth, markAllNotificationsRead);
notificationRouter.post('/:notificationId/read', requireAuth, validateRequest(notificationIdParamSchema), markNotificationRead);
