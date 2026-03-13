import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9._]+$/),
    password: z.string().min(8).max(72),
    name: z.string().min(1).max(80),
    role: z.enum(['student', 'teacher']).default('student'),
    rolePassword: z.string().optional()
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const loginSchema = z.object({
  body: z.object({
    emailOrUsername: z.string().min(3),
    password: z.string().min(8).max(72)
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});
