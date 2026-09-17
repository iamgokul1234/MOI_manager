import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { peopleApi } from '@/api/people';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage, getPersonName } from '@/lib/utils';
import { invalidateMoiData, qk } from '@/lib/queryClient';
import type { Person } from '@/types';

const schema = z
  .object({
    husbandName: z.string().trim().max(100).optional(),
    wifeName: z.string().trim().max(100).optional(),
    area: z.string().trim().min(1, 'Area is required').max(100),
    phone: z.string().trim().max(20).optional(),
    alternatePhone: z.string().trim().max(20).optional(),
    address: z.string().trim().max(500).optional(),
    notes: z.string().trim().max(1000).optional(),
  })
  .refine((d) => (d.husbandName && d.husbandName.length > 0) || (d.wifeName && d.wifeName.length > 0), {
    message: 'Enter at least the husband’s or the wife’s name',
    path: ['husbandName'],
  });

type FormData = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Present → edit mode. */
  person?: Person | null;
  /** Pre-fills the husband name when creating from a typeahead's "Add new" action. */
  seedName?: string;
  onCreated?: (person: Person) => void;
}

const empty: FormData = {
  husbandName: '',
  wifeName: '',
  area: '',
  phone: '',
  alternatePhone: '',
  address: '',
  notes: '',
};

export const AddEditPersonModal: React.FC<Props> = ({ isOpen, onClose, person, seedName, onCreated }) => {
  const isEdit = !!person;
  const { success, error } = useToast();
  const qc = useQueryClient();
  const [duplicates, setDuplicates] = useState<Person[]>([]);
  const [pending, setPending] = useState<FormData | null>(null);
  const [checking, setChecking] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: empty });

  useEffect(() => {
    if (!isOpen) return;
    setDuplicates([]);
    setPending(null);
    if (person) {
      reset({
        husbandName: person.husbandName || '',
        wifeName: person.wifeName || '',
        area: person.area,
        phone: person.phone || '',
        alternatePhone: person.alternatePhone || '',
        address: person.address || '',
        notes: person.notes || '',
      });
    } else {
      reset({ ...empty, husbandName: seedName || '' });
    }
  }, [person, isOpen, seedName, reset]);

  const createMutation = useMutation({
    mutationFn: (data: FormData) => peopleApi.create(data),
    onSuccess: (res) => {
      success(`${getPersonName(res.data)} added`);
      qc.invalidateQueries({ queryKey: qk.people });
      qc.invalidateQueries({ queryKey: qk.areas });
      qc.invalidateQueries({ queryKey: qk.dashboard });
      onCreated?.(res.data);
      onClose();
    },
    onError: (err) => error(getErrorMessage(err, 'Could not add the person')),
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => peopleApi.update(person!._id, data),
    onSuccess: () => {
      success('Person updated');
      invalidateMoiData(qc, { personId: person!._id });
      qc.invalidateQueries({ queryKey: qk.areas });
      onClose();
    },
    onError: (err) => error(getErrorMessage(err, 'Could not update the person')),
  });

  const isPending = createMutation.isPending || updateMutation.isPending || checking;

  const doSubmit = (data: FormData) => {
    if (isEdit) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  // Non-blocking duplicate detection: warn, then let the user decide.
  const onSubmit = async (data: FormData) => {
    setChecking(true);
    try {
      const res = await peopleApi.checkDuplicate({
        husbandName: data.husbandName,
        wifeName: data.wifeName,
        area: data.area,
        excludeId: person?._id,
      });
      if (res.data.duplicates.length > 0) {
        setDuplicates(res.data.duplicates);
        setPending(data);
        return;
      }
    } catch {
      // If the check itself fails, don't block saving.
    } finally {
      setChecking(false);
    }
    doSubmit(data);
  };

  return (
    <>
      <Modal
        isOpen={isOpen && duplicates.length === 0}
        onClose={onClose}
        title={isEdit ? 'Edit Person' : 'Add Person'}
        description="A family record. Either name is enough."
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 sm:p-6 space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Husband's name"
              id="husband-name"
              placeholder="e.g. Ravi"
              autoComplete="off"
              error={errors.husbandName?.message}
              {...register('husbandName')}
            />
            <Input label="Wife's name" id="wife-name" placeholder="e.g. Meena" autoComplete="off" {...register('wifeName')} />
          </div>
          <Input
            label="Area"
            id="area"
            placeholder="e.g. Tiruppur"
            required
            autoComplete="off"
            error={errors.area?.message}
            {...register('area')}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Phone" id="phone" type="tel" inputMode="tel" placeholder="Mobile number" {...register('phone')} />
            <Input label="Alternate phone" id="alt-phone" type="tel" inputMode="tel" placeholder="Optional" {...register('alternatePhone')} />
          </div>
          <Input label="Address" id="address" placeholder="Street, town" {...register('address')} />
          <Textarea
            label="Notes"
            id="person-notes"
            placeholder="How you know them, anything to remember…"
            rows={2}
            {...register('notes')}
          />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={isPending}>
              {isEdit ? 'Save changes' : 'Add Person'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={duplicates.length > 0}
        onClose={() => setDuplicates([])}
        title="Possible duplicate"
        size="sm"
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-3 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
            <p className="text-sm font-semibold">A similar person already exists</p>
          </div>
          <div className="space-y-2 mb-4">
            {duplicates.map((d) => (
              <div key={d._id} className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-sm">
                <p className="font-medium text-gray-900">{getPersonName(d)}</p>
                <p className="text-xs text-gray-500">
                  {d.area}
                  {d.phone && ` · ${d.phone}`}
                </p>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600 mb-5">
            {isEdit ? 'Save these changes anyway?' : 'Is this the same family? You can still create a new entry.'}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setDuplicates([])}>
              Go back
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                setDuplicates([]);
                if (pending) doSubmit(pending);
              }}
              loading={isPending}
            >
              {isEdit ? 'Save anyway' : 'Create anyway'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
