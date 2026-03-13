import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

export const listNotificationsSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({}).default({}),
  query: z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20)
  })
});

export const notificationIdParamSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    notificationId: objectId
  }),
  query: z.object({}).default({})
});
