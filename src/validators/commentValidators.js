import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

export const createCommentSchema = z.object({
  body: z.object({
    body: z.string().min(1).max(500),
    parentComment: objectId.optional()
  }),
  params: z.object({
    postId: objectId
  }),
  query: z.object({}).default({})
});

export const commentIdParamSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    commentId: objectId
  }),
  query: z.object({}).default({})
});

export const listCommentsSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    postId: objectId
  }),
  query: z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20)
  })
});
