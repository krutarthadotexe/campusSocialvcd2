import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(80).optional(),
    bio: z.string().max(160).optional(),
    isPrivate: z.boolean().optional()
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const updateAvatarSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const userIdParamSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    userId: objectId
  }),
  query: z.object({}).default({})
});

export const searchUsersSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({}).default({}),
  query: z.object({
    q: z.string().min(1),
    limit: z.coerce.number().int().min(1).max(50).default(20)
  })
});
