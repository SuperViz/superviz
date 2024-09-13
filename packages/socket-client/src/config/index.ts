import z from 'zod';

export const ConfigSchema = z.object({
  serverUrl: z.string(),
});

export type Config = z.infer<typeof ConfigSchema>;


export const config: Config = ConfigSchema.parse({
  serverUrl: 'https://io.superviz.com',
});
