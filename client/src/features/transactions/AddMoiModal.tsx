import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Search, X } from 'lucide-react';
import { peopleApi } from '@/api/people';
import { functionsApi } from '@/api/functions';
import { transactionsApi } from '@/api/transactions';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, formatDate, getPersonName } from '@/lib/utils';
import type { Person, FunctionEvent, TransactionType } from '@/types';

const schema = z.object({
  personId: z.string().min(1, 'Person is required'),
  functionId: z.string().min(1, 'Function is required'),
  type: z.enum(['RECEIVED', 'GIVEN']),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  transactionDate: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface AddMoiModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillPersonId?: string;
  prefillFunctionId?: string;
  onSuccess?: () => void;
}

export const AddMoiModal: React.FC<AddMoiModalProps> = ({
  isOpen,
  onClose,
  prefillPersonId,
  prefillFunctionId,
  onSuccess,
}) => {
  const [personSearch, setPersonSearch] = useState('');
  const [functionSearch, setFunctionSearch] = useState('');
  const [showPersonDropdown, setShowPersonDropdown] = useState(false);
  const [showFunctionDropdown, setShowFunctionDropdown] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [selectedFunction, setSelectedFunction] = useState<FunctionEvent | null>(null);
  const [txType, setTxType] = useState<TransactionType>('RECEIVED');

  const { success, error } = useToast();
  const qc = useQueryClient();

  const today = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'RECEIVED',
      transactionDate: today,
    },
  });

  // Load prefill person
  const { data: prefillPerson } = useQuery({
    queryKey: ['person', prefillPersonId],
    queryFn: () => peopleApi.getById(prefillPersonId!).then((r) => r.data),
    enabled: !!prefillPersonId && isOpen,
  });

  const { data: prefillFunction } = useQuery({
    queryKey: ['function', prefillFunctionId],
    queryFn: () => functionsApi.getById(prefillFunctionId!).then((r) => r.data),
    enabled: !!prefillFunctionId && isOpen,
  });

  useEffect(() => {
    if (prefillPerson) {
      setSelectedPerson(prefillPerson);
      setValue('personId', prefillPerson._id);
      setPersonSearch(getPersonName(prefillPerson));
    }
  }, [prefillPerson, setValue]);

  useEffect(() => {
    if (prefillFunction) {
      setSelectedFunction(prefillFunction);
      setValue('functionId', prefillFunction._id);
      setFunctionSearch(prefillFunction.name);
    }
  }, [prefillFunction, setValue]);

  // Person search
  const { data: personResults } = useQuery({
    queryKey: ['people-search', personSearch],
    queryFn: () => peopleApi.list({ search: personSearch, limit: 8 }).then((r) => r.data),
    enabled: showPersonDropdown && personSearch.length >= 1,
  });

  // Function search
  const { data: functionResults } = useQuery({
    queryKey: ['functions-search', functionSearch],
    queryFn: () => functionsApi.list({ search: functionSearch, limit: 8 }).then((r) => r.data),
    enabled: showFunctionDropdown && functionSearch.length >= 1,
  });

  // Person's recent history
  const { data: personHistory } = useQuery({
    queryKey: ['person-history', selectedPerson?._id],
    queryFn: () => transactionsApi.list({ personId: selectedPerson!._id, limit: 3 }).then((r) => r.data),
    enabled: !!selectedPerson,
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      transactionsApi.create({
        personId: data.personId,
        functionId: data.functionId,
        type: data.type,
        amount: data.amount,
        transactionDate: data.transactionDate,
        notes: data.notes,
      }),
    onSuccess: () => {
      success('Moi added successfully!');
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['people'] });
      qc.invalidateQueries({ queryKey: ['functions'] });
      qc.invalidateQueries({ queryKey: ['reports'] });
      if (selectedPerson) qc.invalidateQueries({ queryKey: ['person', selectedPerson._id] });
      handleClose();
      onSuccess?.();
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to add Moi';
      error(msg || 'Failed to add Moi');
    },
  });

  const handleClose = useCallback(() => {
    reset({ type: 'RECEIVED', transactionDate: today });
    setSelectedPerson(null);
    setSelectedFunction(null);
    setPersonSearch('');
    setFunctionSearch('');
    setShowPersonDropdown(false);
    setShowFunctionDropdown(false);
    setTxType('RECEIVED');
    onClose();
  }, [onClose, reset, today]);

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  const selectPerson = (person: Person) => {
    setSelectedPerson(person);
    setValue('personId', person._id);
    setPersonSearch(getPersonName(person));
    setShowPersonDropdown(false);
  };

  const selectFunction = (fn: FunctionEvent) => {
    setSelectedFunction(fn);
    setValue('functionId', fn._id);
    setFunctionSearch(fn.name);
    setShowFunctionDropdown(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Moi" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
        {/* Person Typeahead */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Person <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={personSearch}
              onChange={(e) => {
                setPersonSearch(e.target.value);
                setShowPersonDropdown(true);
                if (!e.target.value) {
                  setSelectedPerson(null);
                  setValue('personId', '');
                }
              }}
              onFocus={() => setShowPersonDropdown(true)}
              placeholder="Search person…"
              className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              id="add-moi-person"
            />
            {selectedPerson && (
              <button
                type="button"
                onClick={() => {
                  setSelectedPerson(null);
                  setValue('personId', '');
                  setPersonSearch('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {showPersonDropdown && personSearch && personResults && personResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                {personResults.map((p) => (
                  <button
                    key={p._id}
                    type="button"
                    onClick={() => selectPerson(p)}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                  >
                    <p className="text-sm font-medium text-gray-900">{getPersonName(p)}</p>
                    <p className="text-xs text-gray-500">{p.area}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
          {errors.personId && (
            <p className="mt-1 text-xs text-red-600">{errors.personId.message}</p>
          )}
        </div>

        {/* Person's history if selected */}
        {selectedPerson && personHistory && personHistory.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Previous Moi History
            </p>
            {personHistory.map((t) => {
              const fn = t.functionId as FunctionEvent;
              return (
                <div key={t._id} className="flex items-center justify-between">
                  <div className="text-xs text-gray-600">{fn?.name || 'Unknown function'}</div>
                  <div className={`text-xs font-semibold ${t.type === 'RECEIVED' ? 'text-received-600' : 'text-given-600'}`}>
                    {t.type === 'RECEIVED' ? '+' : '-'}{formatCurrency(t.amount)}
                  </div>
                </div>
              );
            })}
            <div className="flex justify-between pt-1.5 border-t border-gray-200">
              <span className="text-xs text-gray-500 font-medium">Totals</span>
              <div className="flex gap-3">
                <span className="text-xs font-bold text-received-600">
                  +{formatCurrency(selectedPerson.totalReceived || 0)}
                </span>
                <span className="text-xs font-bold text-given-600">
                  -{formatCurrency(selectedPerson.totalGiven || 0)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Function Typeahead */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Function <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={functionSearch}
              onChange={(e) => {
                setFunctionSearch(e.target.value);
                setShowFunctionDropdown(true);
                if (!e.target.value) {
                  setSelectedFunction(null);
                  setValue('functionId', '');
                }
              }}
              onFocus={() => setShowFunctionDropdown(true)}
              placeholder="Search function…"
              className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              id="add-moi-function"
            />
            {selectedFunction && (
              <button
                type="button"
                onClick={() => {
                  setSelectedFunction(null);
                  setValue('functionId', '');
                  setFunctionSearch('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {showFunctionDropdown && functionSearch && functionResults && functionResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                {functionResults.map((f) => (
                  <button
                    key={f._id}
                    type="button"
                    onClick={() => selectFunction(f)}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                  >
                    <p className="text-sm font-medium text-gray-900">{f.name}</p>
                    <p className="text-xs text-gray-500">
                      {f.type} · {formatDate(f.date)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
          {errors.functionId && (
            <p className="mt-1 text-xs text-red-600">{errors.functionId.message}</p>
          )}
        </div>

        {/* Type toggle */}
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    field.onChange('RECEIVED');
                    setTxType('RECEIVED');
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    field.value === 'RECEIVED'
                      ? 'bg-white text-received-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  id="type-received"
                >
                  <ArrowDown className="h-4 w-4" />
                  Received
                </button>
                <button
                  type="button"
                  onClick={() => {
                    field.onChange('GIVEN');
                    setTxType('GIVEN');
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    field.value === 'GIVEN'
                      ? 'bg-white text-given-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  id="type-given"
                >
                  <ArrowUp className="h-4 w-4" />
                  Given
                </button>
              </div>
            </div>
          )}
        />

        {/* Amount */}
        <Input
          label="Amount (₹)"
          type="number"
          id="add-moi-amount"
          placeholder="0"
          min="1"
          step="1"
          inputMode="numeric"
          error={errors.amount?.message}
          {...register('amount')}
        />

        {/* Date */}
        <Input
          label="Date"
          type="date"
          id="add-moi-date"
          error={errors.transactionDate?.message}
          {...register('transactionDate')}
        />

        {/* Notes */}
        <Textarea
          label="Notes (optional)"
          id="add-moi-notes"
          placeholder="Any notes…"
          rows={2}
          {...register('notes')}
        />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={mutation.isPending}>
            Add Moi
          </Button>
        </div>
      </form>
    </Modal>
  );
};
