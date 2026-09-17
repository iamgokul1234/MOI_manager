import { z } from 'zod';
import { FUNCTION_CATEGORIES } from '../models/FunctionEvent';

const dateString = z.string().refine((d) => !isNaN(Date.parse(d)), { message: 'Invalid date' });

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? v : undefined));

export const createFunctionSchema = z.object({
  name: z.string().trim().min(1, 'Function name is required').max(200),
  category: z.enum(FUNCTION_CATEGORIES, {
    errorMap: () => ({ message: 'Category must be OUR or RELATIVE' }),
  }),
  type: z.string().trim().min(1, 'Type is required').max(100),
  date: dateString,
  time: optionalTrimmed(50),
  location: optionalTrimmed(200),
  notes: optionalTrimmed(1000),
});

export const updateFunctionSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    category: z.enum(FUNCTION_CATEGORIES).optional(),
    type: z.string().trim().min(1).max(100).optional(),
    date: dateString.optional(),
    time: z.string().trim().max(50).optional().nullable(),
    location: z.string().trim().max(200).optional().nullable(),
    notes: z.string().trim().max(1000).optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const listFunctionsQuerySchema = z.object({
  category: z.enum(FUNCTION_CATEGORIES).optional(),
  search: z.string().optional(),
  type: z.string().optional(),
  upcoming: z.enum(['true', 'false']).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const functionPeopleQuerySchema = z.object({
  search: z.string().optional(),
  area: z.string().optional(),
  type: z.enum(['RECEIVED', 'GIVEN']).optional(),
  attended: z.enum(['true', 'false']).optional(),
});

export type CreateFunctionInput = z.infer<typeof createFunctionSchema>;
export type UpdateFunctionInput = z.infer<typeof updateFunctionSchema>;
