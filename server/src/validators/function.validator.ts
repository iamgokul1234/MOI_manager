import { z } from 'zod';

export const createFunctionSchema = z.object({
  name: z.string().min(1, 'Function name is required').max(200),
  type: z.string().min(1, 'Type is required').max(100),
  date: z.string().refine((d) => !isNaN(Date.parse(d)), { message: 'Invalid date' }),
  location: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
});

export const updateFunctionSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  type: z.string().min(1).max(100).optional(),
  date: z
    .string()
    .refine((d) => !isNaN(Date.parse(d)), { message: 'Invalid date' })
    .optional(),
  location: z.string().max(200).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export type CreateFunctionInput = z.infer<typeof createFunctionSchema>;
export type UpdateFunctionInput = z.infer<typeof updateFunctionSchema>;
