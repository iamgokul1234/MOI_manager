import { z } from 'zod';

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? v : undefined));

export const createPersonSchema = z
  .object({
    area: z.string().trim().min(1, 'Area is required').max(100),
    husbandName: optionalTrimmed(100),
    wifeName: optionalTrimmed(100),
    phone: optionalTrimmed(20),
    alternatePhone: optionalTrimmed(20),
    address: optionalTrimmed(500),
    notes: optionalTrimmed(1000),
  })
  .refine((data) => data.husbandName || data.wifeName, {
    message: 'At least one of husband name or wife name must be provided',
    path: ['husbandName'],
  });

export const updatePersonSchema = z
  .object({
    area: z.string().trim().min(1).max(100).optional(),
    husbandName: z.string().trim().max(100).optional().nullable(),
    wifeName: z.string().trim().max(100).optional().nullable(),
    phone: z.string().trim().max(20).optional().nullable(),
    alternatePhone: z.string().trim().max(20).optional().nullable(),
    address: z.string().trim().max(500).optional().nullable(),
    notes: z.string().trim().max(1000).optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export type CreatePersonInput = z.infer<typeof createPersonSchema>;
export type UpdatePersonInput = z.infer<typeof updatePersonSchema>;
