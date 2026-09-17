import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { transactionsApi } from '@/api/transactions';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { SegmentedControl } from '@/components/ui/Tabs';
import { CategoryBadge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage, getPersonName, idOf, isPopulated, toInputDate } from '@/lib/utils';
import { invalidateMoiData } from '@/lib/queryClient';
import type { Transaction, TransactionType } from '@/types';

const schema = z.object({
  type: z.enum(['RECEIVED', 'GIVEN']),
  amount: z.coerce
    .number({ invalid_type_error: 'Enter an amount' })
    .positive('Amount must be greater than 0'),
  transactionDate: z.string().min(1, 'Date is required'),
  attended: z.boolean(),
  notes: z.string().trim().max(1000).optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export const EditTransactionModal: React.FC<Props> = ({ isOpen, onClose, transaction }) => {
  const { success, error } = useToast();
  const qc = useQueryClient();

  const person = transaction && isPopulated(transaction.personId) ? transaction.personId : null;
  const fn = transaction && isPopulated(transaction.functionId) ? transaction.functionId : null;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (transaction && isOpen) {
      reset({
        type: transaction.type,
        amount: transaction.amount,
        transactionDate: toInputDate(transaction.transactionDate),
        attended: transaction.attended ?? true,
        notes: transaction.notes || '',
      });
    }
  }, [transaction, isOpen, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      transactionsApi.update(transaction!._id, {
        type: data.type,
        amount: data.amount,
        transactionDate: data.transactionDate,
        attended: data.attended,
        notes: data.notes || '',
      }),
    onSuccess: () => {
      success('Moi entry updated');
      invalidateMoiData(qc, {
        personId: idOf(transaction!.personId),
        functionId: idOf(transaction!.functionId),
      });
      onClose();
    },
    onError: (err) => error(getErrorMessage(err, 'Could not update the entry')),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Moi entry" size="sm">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-5 sm:p-6 space-y-4" noValidate>
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm">
          <p className="font-semibold text-gray-900">{getPersonName(person)}</p>
          <p className="text-gray-500 flex items-center gap-2 flex-wrap mt-0.5">
            {fn?.name}
            {fn?.category && <CategoryBadge category={fn.category} />}
          </p>
        </div>

        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <SegmentedControl<TransactionType>
              aria-label="Received or given"
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: 'RECEIVED', label: 'Received', icon: <ArrowDownLeft className="h-4 w-4" />, tone: 'received' },
                { value: 'GIVEN', label: 'Given', icon: <ArrowUpRight className="h-4 w-4" />, tone: 'given' },
              ]}
            />
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Amount"
            type="number"
            id="edit-amount"
            prefix="₹"
            min="1"
            step="1"
            inputMode="numeric"
            required
            error={errors.amount?.message}
            {...register('amount')}
          />
          <Input
            label="Date"
            type="date"
            id="edit-date"
            required
            error={errors.transactionDate?.message}
            {...register('transactionDate')}
          />
        </div>

        <label className="flex items-center gap-3 text-sm text-gray-700 min-h-[44px]">
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-gray-300 text-received-600 focus:ring-received-500"
            {...register('attended')}
          />
          Attended the function
        </label>

        <Textarea label="Notes" id="edit-notes" rows={2} error={errors.notes?.message} {...register('notes')} />

        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={mutation.isPending}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
};
