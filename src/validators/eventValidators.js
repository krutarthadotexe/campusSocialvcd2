import { z } from 'zod';

export const createEventSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(120),
    description: z.string().min(1).max(2000),
    location: z.string().min(1).max(200),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime()
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

export const eventIdParamSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    eventId: objectId
  }),
  query: z.object({}).default({})
});

export const updateEventSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(120).optional(),
    description: z.string().min(1).max(2000).optional(),
    location: z.string().min(1).max(200).optional(),
    startsAt: z.string().datetime().optional(),
    endsAt: z.string().datetime().optional()
  }),
  params: z.object({
    eventId: objectId
  }),
  query: z.object({}).default({})
});

export const eventRsvpSchema = z.object({
  body: z.object({
    status: z.enum(['going', 'interested', 'none'])
  }),
  params: z.object({
    eventId: objectId
  }),
  query: z.object({}).default({})
});
