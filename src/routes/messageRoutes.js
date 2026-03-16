import { Router } from 'express';
import {
  createMessage,
  deleteMessage,
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
  deleteMessageSchema,
  directConversationSchema,
  listMessagesSchema
} from '../validators/messageValidators.js';

export const messageRouter = Router();

messageRouter.use(requireAuth);
messageRouter.get('/conversations', listConversations);
messageRouter.post('/conversations/direct/:userId', validateRequest(directConversationSchema), getOrCreateDirectConversation);
messageRouter.get('/conversations/:conversationId/messages', validateRequest(listMessagesSchema), listMessages);
messageRouter.post('/conversations/:conversationId/messages', validateRequest(createMessageSchema), createMessage);
messageRouter.delete('/conversations/:conversationId/messages/:messageId', validateRequest(deleteMessageSchema), deleteMessage);
messageRouter.post('/conversations/:conversationId/read', validateRequest(conversationIdSchema), markConversationRead);
