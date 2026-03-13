import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

export const updateUserRoleSchema = z.object({
  body: z.object({
    role: z.enum(['student', 'teacher', 'admin'])
  }),
  params: z.object({
    userId: objectId
  }),
  query: z.object({}).default({})
});
