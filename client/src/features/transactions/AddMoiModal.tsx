import React, { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDownLeft, ArrowUpRight, CalendarDays, Plus, UserPlus } from 'lucide-react';
import { peopleApi } from '@/api/people';
import { functionsApi } from '@/api/functions';
import { transactionsApi } from '@/api/transactions';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Typeahead } from '@/components/ui/Typeahead';
import { SegmentedControl } from '@/components/ui/Tabs';
import { CategoryBadge, FunctionTypeBadge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, formatDate, getErrorMessage, getPersonName, toInputDate } from '@/lib/utils';
import { invalidateMoiData, qk } from '@/lib/queryClient';
import type { FunctionCategory, FunctionEvent, Person, TransactionType } from '@/types';
import { AddEditFunctionModal } from '@/features/functions/AddEditFunctionModal';
import { AddEditPersonModal } from '@/features/people/AddEditPersonModal';
import { PersonHistoryCard } from './PersonHistoryCard';

const schema = z.object({
  personId: z.string().min(1, 'Choose a person'),
  functionId: z.string().min(1, 'Choose a function'),
  type: z.enum(['RECEIVED', 'GIVEN']),
  amount: z.coerce
    .number({ invalid_type_error: 'Enter an amount' })
    .positive('Amount must be greater than 0'),
  transactionDate: z.string().min(1, 'Date is required'),
  attended: z.boolean(),
  notes: z.string().trim().max(1000).optional(),
});

type FormData = z.infer<typeof schema>;
type CategoryFilter = 'ALL' | FunctionCategory;

export interface AddMoiModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillPerson?: Person | null;
  prefillPersonId?: string;
  prefillFunction?: FunctionEvent | null;
  prefillFunctionId?: string;
  defaultType?: TransactionType;
  onSuccess?: () => void;
}

/**
 * Global "+ Add Moi" form. Person and Function are searchable typeaheads;
 * both support creating a new record inline without leaving the form.
 */
export const AddMoiModal: React.FC<AddMoiModalProps> = ({
  isOpen,
  onClose,
  prefillPerson,
  prefillPersonId,
  prefillFunction,
  prefillFunctionId,
  defaultType = 'RECEIVED',
  onSuccess,
}) => {
  const { success, error } = useToast();
  const qc = useQueryClient();

  const [person, setPerson] = useState<Person | null>(null);
  const [fn, setFn] = useState<FunctionEvent | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('OUR');
  const [showNewFunction, setShowNewFunction] = useState(false);
  const [showNewPerson, setShowNewPerson] = useState(false);
  const [newPersonSeed, setNewPersonSeed] = useState('');

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: defaultType, transactionDate: toInputDate(), attended: false, notes: '' },
  });

  // Resolve prefills given as ids
  const { data: fetchedPerson } = useQuery({
    queryKey: qk.person(prefillPersonId || ''),
    queryFn: () => peopleApi.getById(prefillPersonId!).then((r) => r.data),
    enabled: isOpen && !!prefillPersonId && !prefillPerson,
  });
  const { data: fetchedFunction } = useQuery({
    queryKey: qk.fn(prefillFunctionId || ''),
    queryFn: () => functionsApi.getById(prefillFunctionId!).then((r) => r.data),
    enabled: isOpen && !!prefillFunctionId && !prefillFunction,
  });

  const applyPerson = useCallback(
    (p: Person | null) => {
      setPerson(p);
      setValue('personId', p?._id || '', { shouldValidate: !!p });
    },
    [setValue]
  );

  const applyFunction = useCallback(
    (f: FunctionEvent | null) => {
      setFn(f);
      setValue('functionId', f?._id || '', { shouldValidate: !!f });
      if (f) {
        setCategoryFilter(f.category);
        // Default date to the function date if it is in the past (recording after the event).
        const fnDate = new Date(f.date);
        if (fnDate.getTime() < Date.now()) setValue('transactionDate', toInputDate(fnDate));
      }
    },
    [setValue]
  );

  useEffect(() => {
    if (!isOpen) return;
    reset({ type: defaultType, transactionDate: toInputDate(), attended: false, notes: '', personId: '', functionId: '' });
    setPerson(null);
    setFn(null);
    setCategoryFilter('OUR');
    const p = prefillPerson || fetchedPerson || null;
    const f = prefillFunction || fetchedFunction || null;
    if (p) applyPerson(p);
    if (f) applyFunction(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, prefillPerson, fetchedPerson, prefillFunction, fetchedFunction]);

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      transactionsApi.create({
        personId: data.personId,
        functionId: data.functionId,
        type: data.type,
        amount: data.amount,
        transactionDate: data.transactionDate,
        attended: data.attended,
        notes: data.notes || undefined,
      }),
    onSuccess: (res, vars) => {
      success(
        `${formatCurrency(vars.amount)} ${vars.type === 'RECEIVED' ? 'received from' : 'given to'} ${getPersonName(person)}`
      );
      invalidateMoiData(qc, { personId: vars.personId, functionId: vars.functionId });
      void res;
      onSuccess?.();
      onClose();
    },
    onError: (err) => error(getErrorMessage(err, 'Could not add the Moi entry')),
  });

  const searchPeople = useCallback(
    (q: string) => peopleApi.list({ search: q, limit: 8, sort: q ? 'name' : 'active' }).then((r) => r.data),
    []
  );

  const searchFunctions = useCallback(
    (q: string) =>
      functionsApi
        .list({
          search: q,
          category: categoryFilter === 'ALL' ? undefined : categoryFilter,
          limit: 8,
        })
        .then((r) => r.data),
    [categoryFilter]
  );

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Add Moi" size="md">
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-5 sm:p-6 space-y-4" noValidate>
          <Typeahead<Person>
            label="Person"
            required
            id="add-moi-person"
            queryKey="people"
            placeholder="Search by name, area or phone…"
            value={person}
            onChange={applyPerson}
            search={searchPeople}
            getKey={(p) => p._id}
            getLabel={getPersonName}
            error={errors.personId?.message}
            emptyText="No one found with that name"
            renderItem={(p) => (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{getPersonName(p)}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {p.area}
                    {p.phone && ` · ${p.phone}`}
                  </p>
                </div>
                {(p.totalReceived || p.totalGiven) ? (
                  <div className="text-right text-xs shrink-0">
                    {p.totalReceived ? <p className="text-received-700">↓ {formatCurrency(p.totalReceived)}</p> : null}
                    {p.totalGiven ? <p className="text-given-700">↑ {formatCurrency(p.totalGiven)}</p> : null}
                  </div>
                ) : null}
              </div>
            )}
            footer={(q, close) => (
              <button
                type="button"
                className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-primary-700 hover:bg-primary-50"
                onClick={() => {
                  close();
                  setNewPersonSeed(q);
                  setShowNewPerson(true);
                }}
              >
                <UserPlus className="h-4 w-4" />
                Add a new person{q ? ` "${q}"` : ''}
              </button>
            )}
          />

          {person && <PersonHistoryCard person={person} />}

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="block text-sm font-medium text-gray-700">
                Function <span className="text-red-500" aria-hidden>*</span>
              </span>
              {!fn && (
                <SegmentedControl<CategoryFilter>
                  aria-label="Which functions to search"
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  className="w-56 !p-0.5"
                  options={[
                    { value: 'OUR', label: <span className="text-xs">Ours</span> },
                    { value: 'RELATIVE', label: <span className="text-xs">Relatives'</span> },
                    { value: 'ALL', label: <span className="text-xs">All</span> },
                  ]}
                />
              )}
            </div>
            <Typeahead<FunctionEvent>
              id="add-moi-function"
              queryKey={`functions-${categoryFilter}`}
              placeholder="Search functions…"
              value={fn}
              onChange={applyFunction}
              search={searchFunctions}
              getKey={(f) => f._id}
              getLabel={(f) => f.name}
              error={errors.functionId?.message}
              emptyText="No functions found"
              renderItem={(f) => (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{f.name}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {formatDate(f.date)}
                      {f.location && ` · ${f.location}`}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <FunctionTypeBadge type={f.type} />
                    <CategoryBadge category={f.category} />
                  </div>
                </div>
              )}
              footer={(_q, close) => (
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-primary-700 hover:bg-primary-50"
                  onClick={() => {
                    close();
                    setShowNewFunction(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Create a new function
                </button>
              )}
            />
          </div>

          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <div>
                <span className="block text-sm font-medium text-gray-700 mb-1.5">Type</span>
                <SegmentedControl<TransactionType>
                  aria-label="Received or given"
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: 'RECEIVED', label: 'Received', icon: <ArrowDownLeft className="h-4 w-4" />, tone: 'received' },
                    { value: 'GIVEN', label: 'Given', icon: <ArrowUpRight className="h-4 w-4" />, tone: 'given' },
                  ]}
                />
              </div>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Amount"
              type="number"
              id="add-moi-amount"
              prefix="₹"
              placeholder="0"
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
              id="add-moi-date"
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
            <span>
              Attended the function
              <span className="block text-xs text-gray-500">Untick if the Moi was sent without coming.</span>
            </span>
          </label>

          <Textarea
            label="Notes (optional)"
            id="add-moi-notes"
            placeholder="e.g. Given along with a gift"
            rows={2}
            error={errors.notes?.message}
            {...register('notes')}
          />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={mutation.isPending}>
              Save Moi
            </Button>
          </div>
        </form>
      </Modal>

      <AddEditFunctionModal
        isOpen={showNewFunction}
        onClose={() => setShowNewFunction(false)}
        defaultCategory={categoryFilter === 'RELATIVE' ? 'RELATIVE' : 'OUR'}
        onCreated={(created) => applyFunction(created)}
      />

      <AddEditPersonModal
        isOpen={showNewPerson}
        onClose={() => setShowNewPerson(false)}
        seedName={newPersonSeed}
        onCreated={(created) => applyPerson(created)}
      />
    </>
  );
};
