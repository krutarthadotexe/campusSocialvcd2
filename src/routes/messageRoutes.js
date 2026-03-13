import { Router } from 'express';
import {
  createMessage,
  getOrCreateDirectConversation,
  listConversations,
  listMessages,
  markConversationRead
} from '../controllers/messageController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import {
  conversationIdSchema,
  createMessageSchema,
  directConversationSchema,
  listMessagesSchema
} from '../validators/messageValidators.js';

export const messageRouter = Router();

messageRouter.use(requireAuth);
messageRouter.get('/conversations', listConversations);
messageRouter.post('/conversations/direct/:userId', validateRequest(directConversationSchema), getOrCreateDirectConversation);
messageRouter.get('/conversations/:conversationId/messages', validateRequest(listMessagesSchema), listMessages);
messageRouter.post('/conversations/:conversationId/messages', validateRequest(createMessageSchema), createMessage);
messageRouter.post('/conversations/:conversationId/read', validateRequest(conversationIdSchema), markConversationRead);
