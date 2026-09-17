import { z } from 'zod';

export const createPersonSchema = z
  .object({
    area: z.string().min(1, 'Area is required').max(100),
    husbandName: z.string().max(100).optional(),
    wifeName: z.string().max(100).optional(),
    phone: z.string().max(20).optional(),
    alternatePhone: z.string().max(20).optional(),
    address: z.string().max(500).optional(),
    notes: z.string().max(1000).optional(),
  })
  .refine((data) => data.husbandName || data.wifeName, {
    message: 'At least one of husbandName or wifeName must be provided',
    path: ['husbandName'],
  });

export const updatePersonSchema = z
  .object({
    area: z.string().min(1).max(100).optional(),
    husbandName: z.string().max(100).optional().nullable(),
    wifeName: z.string().max(100).optional().nullable(),
    phone: z.string().max(20).optional().nullable(),
    alternatePhone: z.string().max(20).optional().nullable(),
    address: z.string().max(500).optional().nullable(),
    notes: z.string().max(1000).optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export type CreatePersonInput = z.infer<typeof createPersonSchema>;
export type UpdatePersonInput = z.infer<typeof updatePersonSchema>;
