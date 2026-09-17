import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { peopleApi } from '@/api/people';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import type { Person } from '@/types';
import { AlertTriangle } from 'lucide-react';

const schema = z
  .object({
    area: z.string().min(1, 'Area is required'),
    husbandName: z.string().optional(),
    wifeName: z.string().optional(),
    phone: z.string().optional(),
    alternatePhone: z.string().optional(),
    address: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((d) => d.husbandName || d.wifeName, {
    message: 'At least one of Husband Name or Wife Name is required',
    path: ['husbandName'],
  });

type FormData = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  person?: Person | null;
}

export const AddEditPersonModal: React.FC<Props> = ({ isOpen, onClose, person }) => {
  const isEdit = !!person;
  const { success, error } = useToast();
  const qc = useQueryClient();
  const [duplicates, setDuplicates] = React.useState<Person[]>([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = React.useState(false);
  const [pendingData, setPendingData] = React.useState<FormData | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (person) {
      reset({
        area: person.area,
        husbandName: person.husbandName || '',
        wifeName: person.wifeName || '',
        phone: person.phone || '',
        alternatePhone: person.alternatePhone || '',
        address: person.address || '',
        notes: person.notes || '',
      });
    } else {
      reset({});
    }
    setDuplicates([]);
    setShowDuplicateWarning(false);
  }, [person, isOpen, reset]);

  const createMutation = useMutation({
    mutationFn: (data: FormData) => peopleApi.create(data),
    onSuccess: () => {
      success('Person added successfully');
      qc.invalidateQueries({ queryKey: ['people'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
    },
    onError: (err: unknown) => {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Failed to add person';
      error(msg || 'Failed to add person');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => peopleApi.update(person!._id, data),
    onSuccess: () => {
      success('Person updated successfully');
      qc.invalidateQueries({ queryKey: ['people'] });
      qc.invalidateQueries({ queryKey: ['person', person!._id] });
      onClose();
    },
    onError: (err: unknown) => {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Failed to update person';
      error(msg || 'Failed to update person');
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const doSubmit = (data: FormData) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!isEdit) {
      // Check for duplicates
      const res = await peopleApi.checkDuplicate({
        husbandName: data.husbandName,
        wifeName: data.wifeName,
        area: data.area,
      });
      if (res.data.duplicates.length > 0) {
        setDuplicates(res.data.duplicates);
        setShowDuplicateWarning(true);
        setPendingData(data);
        return;
      }
    }
    doSubmit(data);
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !showDuplicateWarning}
        onClose={onClose}
        title={isEdit ? 'Edit Person' : 'Add Person'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Husband's Name"
              id="husband-name"
              placeholder="e.g. Ravi"
              error={errors.husbandName?.message}
              {...register('husbandName')}
            />
            <Input
              label="Wife's Name"
              id="wife-name"
              placeholder="e.g. Meena"
              {...register('wifeName')}
            />
          </div>
          <Input
            label="Area"
            id="area"
            placeholder="e.g. Tiruppur"
            required
            error={errors.area?.message}
            {...register('area')}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone" id="phone" placeholder="Mobile number" {...register('phone')} />
            <Input
              label="Alternate Phone"
              id="alt-phone"
              placeholder="Alternate"
              {...register('alternatePhone')}
            />
          </div>
          <Input label="Address" id="address" placeholder="Full address" {...register('address')} />
          <Textarea
            label="Notes"
            id="person-notes"
            placeholder="Any notes about this family…"
            rows={2}
            {...register('notes')}
          />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={isPending}>
              {isEdit ? 'Save Changes' : 'Add Person'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Duplicate warning */}
      {showDuplicateWarning && (
        <Modal isOpen={true} onClose={() => setShowDuplicateWarning(false)} title="Possible Duplicate Found" size="sm">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              <p className="text-sm font-semibold">A similar person already exists</p>
            </div>
            <div className="space-y-2 mb-4">
              {duplicates.map((d) => (
                <div key={d._id} className="bg-amber-50 rounded-lg px-3 py-2 text-sm">
                  <p className="font-medium">{[d.husbandName, d.wifeName].filter(Boolean).join(' & ')}</p>
                  <p className="text-xs text-gray-500">{d.area}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Do you want to create a new entry anyway?
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowDuplicateWarning(false)}>
                Go Back
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => { setShowDuplicateWarning(false); if (pendingData) doSubmit(pendingData); }}
                loading={isPending}
              >
                Create Anyway
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
