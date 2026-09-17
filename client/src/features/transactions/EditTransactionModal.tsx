import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { transactionsApi } from '@/api/transactions';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { getPersonName } from '@/lib/utils';
import type { Transaction, Person, FunctionEvent } from '@/types';

const schema = z.object({
  type: z.enum(['RECEIVED', 'GIVEN']),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  transactionDate: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
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

  const person = transaction?.personId as Person;
  const fn = transaction?.functionId as FunctionEvent;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (transaction) {
      reset({
        type: transaction.type,
        amount: transaction.amount,
        transactionDate: transaction.transactionDate?.split('T')[0] || '',
        notes: transaction.notes || '',
      });
    }
  }, [transaction, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      transactionsApi.update(transaction!._id, {
        type: data.type,
        amount: data.amount,
        transactionDate: data.transactionDate,
        notes: data.notes,
      }),
    onSuccess: () => {
      success('Transaction updated');
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['people'] });
      qc.invalidateQueries({ queryKey: ['functions'] });
      onClose();
    },
    onError: () => error('Failed to update transaction'),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Transaction" size="sm">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
        <div className="bg-gray-50 rounded-xl p-3 text-sm">
          <p className="font-medium text-gray-900">{getPersonName(person)}</p>
          <p className="text-gray-500">{fn?.name}</p>
        </div>

        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
              <button
                type="button"
                onClick={() => field.onChange('RECEIVED')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  field.value === 'RECEIVED' ? 'bg-white text-received-700 shadow-sm' : 'text-gray-500'
                }`}
              >
                <ArrowDown className="h-4 w-4" /> Received
              </button>
              <button
                type="button"
                onClick={() => field.onChange('GIVEN')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  field.value === 'GIVEN' ? 'bg-white text-given-700 shadow-sm' : 'text-gray-500'
                }`}
              >
                <ArrowUp className="h-4 w-4" /> Given
              </button>
            </div>
          )}
        />

        <Input
          label="Amount (₹)"
          type="number"
          id="edit-amount"
          min="1"
          error={errors.amount?.message}
          {...register('amount')}
        />
        <Input
          label="Date"
          type="date"
          id="edit-date"
          error={errors.transactionDate?.message}
          {...register('transactionDate')}
        />
        <Textarea label="Notes" id="edit-notes" rows={2} {...register('notes')} />

        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="flex-1" loading={mutation.isPending}>Save</Button>
        </div>
      </form>
    </Modal>
  );
};
