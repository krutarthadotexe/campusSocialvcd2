import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

export const createPostSchema = z.object({
  body: z.object({
    caption: z.string().max(2200).default(''),
    locationText: z.string().max(120).optional(),
    tags: z.union([z.array(z.string().min(1).max(50)).max(20), z.string()]).optional()
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const updatePostSchema = z.object({
  body: z.object({
    caption: z.string().max(2200).optional(),
    locationText: z.string().max(120).optional(),
    tags: z.union([z.array(z.string().min(1).max(50)).max(20), z.string()]).optional()
  }),
  params: z.object({
    postId: objectId
  }),
  query: z.object({}).default({})
});

export const postIdParamSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    postId: objectId
  }),
  query: z.object({}).default({})
});

export const listPostsSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    userId: objectId
  }),
  query: z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(15)
  })
});

export const feedSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({}).default({}),
  query: z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(15)
  })
});
