import { z } from 'zod';

const pattern = /^[-_&@+=,(){}\[\]\/«».|'"#a-zA-Z0-9À-ÿ\s]*$/;

export const InitializeRoomSchema = z.object({
  developerToken: z.string({ message: '[SuperViz | Room] Developer Token is required' }).min(1, { message: '[SuperViz | Room] Developer Token is required' }),
  roomId: z.string().regex(pattern, { message: '[SuperViz | Room] Room id is invalid, it should be between 2 and 64 characters and only accept letters, numbers and special characters: -_&@+=,(){}[]/«».|\'"' }),
  participant: z.object({
    id: z.string().regex(pattern, { message: '[SuperViz | Room] Participant id is invalid, it should be between 2 and 64 characters and only accept letters, numbers and special characters: -_&@+=,(){}[]/«».|\'"' }),
    name: z.string().optional(),
    email: z.string().email().optional(),
    avatar: z.object({
      model3DUrl: z.string().optional(),
      imageUrl: z.string().optional(),
    }).optional(),
  }),
  group: z.object({
    id: z.string().regex(pattern, { message: '[SuperViz | Room] Group id is invalid, it should be between 2 and 64 characters and only accept letters, numbers and special characters: -_&@+=,(){}[]/«».|\'"' }),
    name: z.string(),
  }),
  debug: z.boolean().optional(),
  environment: z.enum(['dev', 'prod', 'local'], { message: '[SuperViz | Room] Environment must be either "dev", "prod" or "local"' }).optional(),
});

export type InitializeRoomParams = z.infer<typeof InitializeRoomSchema>;
