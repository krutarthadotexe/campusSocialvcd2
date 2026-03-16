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
  body: z
    .object({
      body: z.string().max(2000).default(''),
      sharedPostId: objectId.optional()
    })
    .superRefine((value, ctx) => {
      if (!value.body.trim() && !value.sharedPostId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Message body or shared post is required',
          path: ['body']
        });
      }
    }),
  params: z.object({
    conversationId: objectId
  }),
  query: z.object({}).default({})
});

export const deleteMessageSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    conversationId: objectId,
    messageId: objectId
  }),
  query: z.object({}).default({})
});
