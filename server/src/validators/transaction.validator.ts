import { z } from 'zod';

const objectId = (label: string) =>
  z.string().regex(/^[a-fA-F0-9]{24}$/, `${label} is not a valid id`);

const dateString = z
  .string()
  .refine((d) => !isNaN(Date.parse(d)), { message: 'Invalid transaction date' });

const amount = z
  .number({ required_error: 'Amount is required', invalid_type_error: 'Amount must be a number' })
  .finite('Amount must be a number')
  .positive('Amount must be greater than 0');

export const createTransactionSchema = z.object({
  personId: objectId('Person'),
  functionId: objectId('Function'),
  type: z.enum(['RECEIVED', 'GIVEN'], {
    errorMap: () => ({ message: 'Type must be RECEIVED or GIVEN' }),
  }),
  amount,
  transactionDate: dateString,
  attended: z.boolean().optional(),
  notes: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? v : undefined)),
});

export const updateTransactionSchema = z
  .object({
    type: z.enum(['RECEIVED', 'GIVEN']).optional(),
    amount: amount.optional(),
    transactionDate: dateString.optional(),
    attended: z.boolean().optional(),
    notes: z.string().trim().max(1000).optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const attendanceSchema = z.object({
  attended: z.boolean({
    required_error: 'attended is required',
    invalid_type_error: 'attended must be true or false',
  }),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
