import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

export const directConversationSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    userId: objectId
  }),
  query: z.object({}).default({})
});

export const conversationIdSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    conversationId: objectId
  }),
  query: z.object({}).default({})
});

export const listMessagesSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    conversationId: objectId
  }),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(50)
  })
});

export const createMessageSchema = z.object({
  body: z.object({
    body: z.string().min(1).max(2000)
  }),
  params: z.object({
    conversationId: objectId
  }),
  query: z.object({}).default({})
});
