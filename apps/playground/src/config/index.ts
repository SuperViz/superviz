
import { get as _get } from 'lodash';
import z from 'zod';

export const envSchema = z.object({
  VITE_SUPERVIZ_ROOM_PREFIX: z.string(),
  VITE_SUPERVIZ_DEVELOPER_TOKEN: z.string(),
  VITE_FORGE_CLIENT_ID: z.string(),
  VITE_FORGE_CLIENT_SECRET: z.string(),
  VITE_MATTERPORT_KEY: z.string(),
})

export type Env = z.infer<typeof envSchema>

export const env = envSchema.parse(Object.assign(import.meta.env));

export const config = {
  roomPrefix: env.VITE_SUPERVIZ_ROOM_PREFIX,
  keys: {
    matterport: env.VITE_MATTERPORT_KEY,
    superviz: env.VITE_SUPERVIZ_DEVELOPER_TOKEN,
    forge: {
      clientId: env.VITE_FORGE_CLIENT_ID,
      clientSecret: env.VITE_FORGE_CLIENT_SECRET,
    }
  }
}

type Paths<T> = T extends object ? { [K in keyof T]:
  `${Exclude<K, symbol>}${'' | `.${Paths<T[K]>}`}`
}[keyof T] : never

type Key = Paths<typeof config>

export function getConfig<T>(key: Key, defaultValue?: T): T {
  return _get(
    config,
    key,
    defaultValue as T,
  ) as T;
}