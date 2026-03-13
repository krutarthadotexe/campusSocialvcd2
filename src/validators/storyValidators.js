import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

export const createStorySchema = z.object({
  body: z.object({
    caption: z.string().max(300).optional()
  }).passthrough(),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const storyIdParamSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    storyId: objectId
  }),
  query: z.object({}).default({})
});
