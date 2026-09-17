import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { functionsApi } from '@/api/functions';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import type { FunctionEvent } from '@/types';
import { FUNCTION_TYPES } from './constants';

const schema = z.object({
  name: z.string().min(1, 'Function name is required'),
  type: z.string().min(1, 'Type is required'),
  customType: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  location: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  fn?: FunctionEvent | null;
}

export const AddEditFunctionModal: React.FC<Props> = ({ isOpen, onClose, fn }) => {
  const isEdit = !!fn;
  const [showCustomType, setShowCustomType] = useState(false);
  const { success, error } = useToast();
  const qc = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const typeValue = watch('type');

  useEffect(() => {
    setShowCustomType(typeValue === 'Other');
  }, [typeValue]);

  useEffect(() => {
    if (fn) {
      const isCustom = !FUNCTION_TYPES.includes(fn.type as (typeof FUNCTION_TYPES)[number]);
      reset({
        name: fn.name,
        type: isCustom ? 'Other' : fn.type,
        customType: isCustom ? fn.type : '',
        date: fn.date ? fn.date.split('T')[0] : '',
        location: fn.location || '',
        notes: fn.notes || '',
      });
    } else {
      reset({ date: new Date().toISOString().split('T')[0] });
    }
  }, [fn, isOpen, reset]);

  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      functionsApi.create({
        name: data.name,
        type: data.type === 'Other' && data.customType ? data.customType : data.type,
        date: data.date,
        location: data.location,
        notes: data.notes,
      }),
    onSuccess: () => {
      success('Function created successfully');
      qc.invalidateQueries({ queryKey: ['functions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
    },
    onError: (err: unknown) => {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Failed to create function';
      error(msg || 'Failed to create function');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) =>
      functionsApi.update(fn!._id, {
        name: data.name,
        type: data.type === 'Other' && data.customType ? data.customType : data.type,
        date: data.date,
        location: data.location,
        notes: data.notes,
      }),
    onSuccess: () => {
      success('Function updated successfully');
      qc.invalidateQueries({ queryKey: ['functions'] });
      qc.invalidateQueries({ queryKey: ['function', fn!._id] });
      onClose();
    },
    onError: (err: unknown) => {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Failed to update function';
      error(msg || 'Failed to update function');
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: FormData) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Function' : 'Add Function'} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
        <Input
          label="Function Name"
          id="function-name"
          placeholder="e.g. Krish Wedding"
          required
          error={errors.name?.message}
          {...register('name')}
        />

        <Select
          label="Type"
          id="function-type"
          required
          options={[
            ...FUNCTION_TYPES.map((t) => ({ value: t, label: t })),
          ]}
          placeholder="Select type"
          error={errors.type?.message}
          {...register('type')}
        />

        {showCustomType && (
          <Input
            label="Custom Type"
            id="custom-type"
            placeholder="e.g. Ear Piercing Ceremony"
            {...register('customType')}
          />
        )}

        <Input
          label="Date"
          type="date"
          id="function-date"
          required
          error={errors.date?.message}
          {...register('date')}
        />

        <Input
          label="Location (optional)"
          id="function-location"
          placeholder="e.g. Town Hall, Tiruppur"
          {...register('location')}
        />

        <Textarea
          label="Notes (optional)"
          id="function-notes"
          placeholder="Any additional notes…"
          rows={2}
          {...register('notes')}
        />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={isPending}>
            {isEdit ? 'Save Changes' : 'Add Function'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
