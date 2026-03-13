import { Router } from 'express';
import { createEvent, deleteEvent, getEventMedia, listEvents, updateEvent, updateEventRsvp } from '../controllers/eventController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { eventPhotoUpload } from '../middleware/upload.js';
import { validateRequest } from '../middleware/validate.js';
import { createEventSchema, eventIdParamSchema, eventRsvpSchema, updateEventSchema } from '../validators/eventValidators.js';

export const eventRouter = Router();

eventRouter.get('/', requireAuth, listEvents);
eventRouter.post('/', requireAuth, requireRole('teacher', 'admin'), eventPhotoUpload, validateRequest(createEventSchema), createEvent);
eventRouter.get('/:eventId/media/:photoIndex', getEventMedia);
eventRouter.patch('/:eventId', requireAuth, requireRole('teacher', 'admin'), eventPhotoUpload, validateRequest(updateEventSchema), updateEvent);
eventRouter.delete('/:eventId', requireAuth, requireRole('teacher', 'admin'), validateRequest(eventIdParamSchema), deleteEvent);
eventRouter.post('/:eventId/rsvp', requireAuth, validateRequest(eventRsvpSchema), updateEventRsvp);
