import z from 'zod';

import { PresenceSchema } from '../../common/types/presence.types';

export type SocketEvent<T extends any | unknown> = {
  name: string;
  roomId: string;
  connectionId: string;
  presence?: z.infer<typeof PresenceSchema>;
  data: T;
  timestamp: number;
};

export type RoomHistory = {
  roomId: string;
  room: {
    id?: string;
    name?: string;
    userId: string;
    apiKey: string;
    createdAt: Date;
  };
  events: SocketEvent<unknown>[];
  connectionId: string;
  timestamp: Date;
};

export type Callback<T> = (event: SocketEvent<T>) => void;

export const JoinRoomSchema = z.object({
  name: z.string(),
  user: z.object({
    id: z.string(),
    name: z.string().nullable(),
  }),
  maxConnections: z.union([z.number(), z.literal('unlimited'), z.undefined()]),
});

export type JoinRoomPayload = z.infer<typeof JoinRoomSchema>;
