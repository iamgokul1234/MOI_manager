import { z } from 'zod';

export const createTransactionSchema = z.object({
  personId: z.string().min(1, 'Person is required'),
  functionId: z.string().min(1, 'Function is required'),
  type: z.enum(['RECEIVED', 'GIVEN'], { required_error: 'Type must be RECEIVED or GIVEN' }),
  amount: z
    .number({ required_error: 'Amount is required', invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be greater than 0'),
  transactionDate: z
    .string()
    .refine((d) => !isNaN(Date.parse(d)), { message: 'Invalid transaction date' }),
  notes: z.string().max(1000).optional(),
});

export const updateTransactionSchema = z.object({
  type: z.enum(['RECEIVED', 'GIVEN']).optional(),
  amount: z.number().positive('Amount must be greater than 0').optional(),
  transactionDate: z
    .string()
    .refine((d) => !isNaN(Date.parse(d)), { message: 'Invalid date' })
    .optional(),
  notes: z.string().max(1000).optional().nullable(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
