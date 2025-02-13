import { z } from 'zod';

export const BrandSchema = z.object({
  logoUrl: z.string().url('[SuperViz] - logoUrl must be a valid URL').optional(),
});

export type Brand = {
  logoUrl?: string;
  styles?: string;
}
