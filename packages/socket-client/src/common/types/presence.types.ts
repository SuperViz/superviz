import { z } from 'zod';

export const PresenceSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
});

export type Presence = z.infer<typeof PresenceSchema>;
