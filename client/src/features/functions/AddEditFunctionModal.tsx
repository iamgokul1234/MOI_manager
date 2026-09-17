import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Home, Users } from 'lucide-react';
import { functionsApi } from '@/api/functions';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { SegmentedControl } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage, toInputDate } from '@/lib/utils';
import { invalidateMoiData, qk } from '@/lib/queryClient';
import type { FunctionCategory, FunctionEvent } from '@/types';
import { FUNCTION_TYPE_OPTIONS, isKnownType } from './constants';

const schema = z
  .object({
    category: z.enum(['OUR', 'RELATIVE']),
    name: z.string().trim().min(1, 'Function name is required').max(200),
    type: z.string().min(1, 'Choose a type'),
    customType: z.string().trim().max(100).optional(),
    date: z.string().min(1, 'Date is required'),
    time: z.string().optional(),
    location: z.string().trim().max(200).optional(),
    notes: z.string().trim().max(1000).optional(),
  })
  .refine((d) => d.type !== 'Other' || (d.customType && d.customType.length > 0), {
    message: 'Tell us what kind of function this is',
    path: ['customType'],
  });

type FormData = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Present → edit mode. */
  fn?: FunctionEvent | null;
  /** Pre-selects the category when creating (e.g. from the active tab). */
  defaultCategory?: FunctionCategory;
  /** Called with the newly created function (used by inline "create new" flows). */
  onCreated?: (fn: FunctionEvent) => void;
}

const resolveType = (d: FormData): string =>
  d.type === 'Other' && d.customType ? d.customType.trim() : d.type;

export const AddEditFunctionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  fn,
  defaultCategory = 'OUR',
  onCreated,
}) => {
  const isEdit = !!fn;
  const { success, error } = useToast();
  const qc = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: defaultCategory, type: '', date: toInputDate() },
  });

  const typeValue = watch('type');
  const category = watch('category');

  useEffect(() => {
    if (!isOpen) return;
    if (fn) {
      const known = isKnownType(fn.type);
      reset({
        category: fn.category,
        name: fn.name,
        type: known ? fn.type : 'Other',
        customType: known ? '' : fn.type,
        date: toInputDate(fn.date),
        time: fn.time || '',
        location: fn.location || '',
        notes: fn.notes || '',
      });
    } else {
      reset({
        category: defaultCategory,
        name: '',
        type: '',
        customType: '',
        date: toInputDate(),
        time: '',
        location: '',
        notes: '',
      });
    }
  }, [fn, isOpen, defaultCategory, reset]);

  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      functionsApi.create({
        name: data.name,
        category: data.category,
        type: resolveType(data),
        date: data.date,
        time: data.time || undefined,
        location: data.location || undefined,
        notes: data.notes || undefined,
      }),
    onSuccess: (res) => {
      success(`${res.data.name} added`);
      qc.invalidateQueries({ queryKey: qk.functions });
      qc.invalidateQueries({ queryKey: qk.dashboard });
      qc.invalidateQueries({ queryKey: qk.reports });
      onCreated?.(res.data);
      onClose();
    },
    onError: (err) => error(getErrorMessage(err, 'Could not add the function')),
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) =>
      functionsApi.update(fn!._id, {
        name: data.name,
        category: data.category,
        type: resolveType(data),
        date: data.date,
        time: data.time || '',
        location: data.location || '',
        notes: data.notes || '',
      }),
    onSuccess: () => {
      success('Function updated');
      invalidateMoiData(qc, { functionId: fn!._id });
      onClose();
    },
    onError: (err) => error(getErrorMessage(err, 'Could not update the function')),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: FormData) => {
    if (isEdit) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Function' : 'Add Function'}
      description={
        isEdit ? undefined : 'Is this an event you are hosting, or one you plan to attend?'
      }
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="p-5 sm:p-6 space-y-4" noValidate>
        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-1.5">Category</span>
              <SegmentedControl<FunctionCategory>
                aria-label="Function category"
                value={field.value}
                onChange={field.onChange}
                options={[
                  { value: 'OUR', label: 'Our Function', icon: <Home className="h-4 w-4" /> },
                  { value: 'RELATIVE', label: 'Relative Function', icon: <Users className="h-4 w-4" /> },
                ]}
              />
              <p className="text-xs text-gray-500 mt-1.5">
                {field.value === 'OUR'
                  ? 'We host it. Keep the full Moi ledger with attendance.'
                  : 'Someone else hosts it. A reminder of when and where to go.'}
              </p>
            </div>
          )}
        />

        <Input
          label="Function name"
          id="function-name"
          placeholder={category === 'OUR' ? 'e.g. Krish Wedding' : 'e.g. Ravi Wedding'}
          required
          error={errors.name?.message}
          {...register('name')}
        />

        <Select
          label="Type"
          id="function-type"
          required
          options={FUNCTION_TYPE_OPTIONS}
          placeholder="Select type"
          error={errors.type?.message}
          {...register('type')}
        />

        {typeValue === 'Other' && (
          <Input
            label="What kind of function?"
            id="custom-type"
            placeholder="e.g. Retirement party"
            required
            error={errors.customType?.message}
            {...register('customType')}
          />
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Date"
            type="date"
            id="function-date"
            required
            error={errors.date?.message}
            {...register('date')}
          />
          <Input
            label={category === 'RELATIVE' ? 'Time' : 'Time (optional)'}
            type="time"
            id="function-time"
            error={errors.time?.message}
            {...register('time')}
          />
        </div>

        <Input
          label="Location"
          id="function-location"
          placeholder="e.g. Town Hall, Tiruppur"
          error={errors.location?.message}
          {...register('location')}
        />

        <Textarea
          label="Notes (optional)"
          id="function-notes"
          placeholder={
            category === 'RELATIVE' ? 'e.g. Take the gift box, leave by 5 PM' : 'Anything worth remembering'
          }
          rows={2}
          error={errors.notes?.message}
          {...register('notes')}
        />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={isPending}>
            {isEdit ? 'Save changes' : 'Add Function'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
