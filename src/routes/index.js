import { Router } from 'express';
import { openApiDocument } from '../docs/openapi.js';
import { adminRouter } from './adminRoutes.js';
import { authRouter } from './authRoutes.js';
import { commentRouter } from './commentRoutes.js';
import { eventRouter } from './eventRoutes.js';
import { messageRouter } from './messageRoutes.js';
import { notificationRouter } from './notificationRoutes.js';
import { postRouter } from './postRoutes.js';
import { storyRouter } from './storyRoutes.js';
import { userRouter } from './userRoutes.js';

export const apiRouter = Router();

apiRouter.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

apiRouter.get('/docs', (req, res) => {
  res.json({ success: true, data: openApiDocument });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/events', eventRouter);
apiRouter.use('/posts', postRouter);
apiRouter.use('/stories', storyRouter);
apiRouter.use('/', commentRouter);
apiRouter.use('/messages', messageRouter);
apiRouter.use('/notifications', notificationRouter);
