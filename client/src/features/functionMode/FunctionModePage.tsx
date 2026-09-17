import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Search,
  CheckCircle2,
  Loader2,
  X,
  Zap,
} from 'lucide-react';
import { functionsApi } from '@/api/functions';
import { peopleApi } from '@/api/people';
import { transactionsApi } from '@/api/transactions';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, formatDate, getPersonName } from '@/lib/utils';
import type { Person, FunctionEvent, TransactionType } from '@/types';

export const FunctionModePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { success, error: toastError } = useToast();
  const qc = useQueryClient();

  // State
  const [search, setSearch] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [amount, setAmount] = useState('');
  const [txType, setTxType] = useState<TransactionType>('RECEIVED');
  const [sessionCount, setSessionCount] = useState(0);
  const [lastAdded, setLastAdded] = useState<{ name: string; amount: number; type: TransactionType } | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  const { data: fn, isLoading: fnLoading } = useQuery({
    queryKey: ['function', id],
    queryFn: () => functionsApi.getById(id!).then((r) => r.data),
    enabled: !!id,
  });

  const { data: searchResults, isLoading: searching } = useQuery({
    queryKey: ['people-mode-search', search],
    queryFn: () => peopleApi.list({ search, limit: 6 }).then((r) => r.data),
    enabled: search.length >= 1,
  });

  const { data: personHistory } = useQuery({
    queryKey: ['person-mode-history', selectedPerson?._id],
    queryFn: () =>
      transactionsApi.list({ personId: selectedPerson!._id, limit: 3 }).then((r) => r.data),
    enabled: !!selectedPerson,
  });

  const mutation = useMutation({
    mutationFn: () =>
      transactionsApi.create({
        personId: selectedPerson!._id,
        functionId: id!,
        type: txType,
        amount: parseFloat(amount),
        transactionDate: new Date().toISOString().split('T')[0],
      }),
    onSuccess: () => {
      const name = getPersonName(selectedPerson);
      const amt = parseFloat(amount);
      setLastAdded({ name, amount: amt, type: txType });
      setSessionCount((c) => c + 1);
      qc.invalidateQueries({ queryKey: ['function', id] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      // Reset for next entry
      setSelectedPerson(null);
      setSearch('');
      setAmount('');
      setTxType('RECEIVED');
      setTimeout(() => searchRef.current?.focus(), 100);
    },
    onError: () => toastError('Failed to save transaction'),
  });

  // Autofocus search on mount
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  // When person selected, focus amount
  useEffect(() => {
    if (selectedPerson) {
      amountRef.current?.focus();
    }
  }, [selectedPerson]);

  const handlePersonSelect = useCallback((person: Person) => {
    setSelectedPerson(person);
    setSearch(getPersonName(person));
  }, []);

  const clearPerson = () => {
    setSelectedPerson(null);
    setSearch('');
    setAmount('');
    setTimeout(() => searchRef.current?.focus(), 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPerson || !amount || parseFloat(amount) <= 0) return;
    mutation.mutate();
  };

  const handleAmountKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  if (fnLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header bar */}
      <div className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            to={`/functions/${id}`}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-semibold text-amber-400">Function Mode</span>
            </div>
            <p className="text-white font-bold truncate">{fn?.name}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary-400">{sessionCount}</p>
            <p className="text-xs text-gray-500">this session</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Last added banner */}
        {lastAdded && (
          <div className="bg-received-700/20 border border-received-600/30 rounded-xl px-4 py-3 flex items-center gap-3 animate-slide-up">
            <CheckCircle2 className="h-5 w-5 text-received-400 shrink-0" />
            <div className="flex-1 text-sm">
              <span className="font-semibold text-white">{lastAdded.name}</span>{' '}
              <span className="text-gray-400">
                {lastAdded.type === 'RECEIVED' ? 'received' : 'gave'}
              </span>{' '}
              <span className={`font-bold ${lastAdded.type === 'RECEIVED' ? 'text-received-400' : 'text-given-400'}`}>
                {formatCurrency(lastAdded.amount)}
              </span>
            </div>
            <button onClick={() => setLastAdded(null)} className="text-gray-500 hover:text-gray-300">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Search box */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (selectedPerson) setSelectedPerson(null);
            }}
            placeholder="Search person by name, area, phone…"
            className="w-full bg-gray-900 border border-gray-700 rounded-2xl pl-12 pr-4 py-4 text-lg text-white placeholder-gray-600 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            id="function-mode-search"
            autoComplete="off"
          />
          {search && (
            <button
              onClick={clearPerson}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Search results */}
        {!selectedPerson && search && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            {searching ? (
              <div className="py-4 text-center">
                <Loader2 className="h-5 w-5 animate-spin text-gray-500 mx-auto" />
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              searchResults.map((person) => (
                <button
                  key={person._id}
                  onClick={() => handlePersonSelect(person)}
                  className="w-full text-left px-5 py-4 border-b border-gray-800 last:border-0 hover:bg-gray-800 active:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white text-base">{getPersonName(person)}</p>
                      <p className="text-sm text-gray-500">{person.area}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {(person.totalReceived || 0) > 0 && (
                        <p className="text-xs text-received-400">
                          Rcvd {formatCurrency(person.totalReceived || 0)}
                        </p>
                      )}
                      {(person.totalGiven || 0) > 0 && (
                        <p className="text-xs text-given-400">
                          Gave {formatCurrency(person.totalGiven || 0)}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="py-6 text-center text-gray-500 text-sm">No people found</div>
            )}
          </div>
        )}

        {/* Selected person entry card */}
        {selectedPerson && (
          <form onSubmit={handleSubmit} className="space-y-4 animate-slide-up">
            {/* Person card */}
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-lg font-bold text-white">{getPersonName(selectedPerson)}</p>
                  <p className="text-sm text-gray-500">{selectedPerson.area}</p>
                </div>
                <button
                  type="button"
                  onClick={clearPerson}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Previous history */}
              {personHistory && personHistory.length > 0 && (
                <div className="border-t border-gray-800 pt-3 mt-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                    Previous Moi
                  </p>
                  {personHistory.map((t) => {
                    const fn = t.functionId as FunctionEvent;
                    return (
                      <div key={t._id} className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-400 truncate">{fn?.name}</span>
                        <span className={`font-semibold ml-3 shrink-0 ${t.type === 'RECEIVED' ? 'text-received-400' : 'text-given-400'}`}>
                          {t.type === 'RECEIVED' ? '+' : '-'}{formatCurrency(t.amount)}
                        </span>
                      </div>
                    );
                  })}
                  <div className="flex justify-between pt-2 border-t border-gray-800 mt-2">
                    <span className="text-xs text-gray-500">Lifetime totals</span>
                    <div className="flex gap-3">
                      <span className="text-xs font-bold text-received-400">+{formatCurrency(selectedPerson.totalReceived || 0)}</span>
                      <span className="text-xs font-bold text-given-400">-{formatCurrency(selectedPerson.totalGiven || 0)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Type toggle */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTxType('RECEIVED')}
                className={`flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-bold transition-all ${
                  txType === 'RECEIVED'
                    ? 'bg-received-600 text-white shadow-lg shadow-received-600/30'
                    : 'bg-gray-900 border border-gray-700 text-gray-400 hover:border-received-700'
                }`}
                id="mode-type-received"
              >
                <ArrowDown className="h-5 w-5" />
                Received
              </button>
              <button
                type="button"
                onClick={() => setTxType('GIVEN')}
                className={`flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-bold transition-all ${
                  txType === 'GIVEN'
                    ? 'bg-given-600 text-white shadow-lg shadow-given-600/30'
                    : 'bg-gray-900 border border-gray-700 text-gray-400 hover:border-given-700'
                }`}
                id="mode-type-given"
              >
                <ArrowUp className="h-5 w-5" />
                Given
              </button>
            </div>

            {/* Amount input */}
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-3xl font-bold text-gray-500">₹</span>
              <input
                ref={amountRef}
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={handleAmountKeyDown}
                placeholder="0"
                min="1"
                step="1"
                inputMode="numeric"
                className="w-full bg-gray-900 border border-gray-700 rounded-2xl pl-14 pr-5 py-5 text-3xl font-bold text-white placeholder-gray-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                id="function-mode-amount"
              />
            </div>

            {/* Save button */}
            <button
              type="submit"
              disabled={!amount || parseFloat(amount) <= 0 || mutation.isPending}
              className={`w-full py-5 rounded-2xl text-lg font-bold transition-all flex items-center justify-center gap-2 ${
                txType === 'RECEIVED'
                  ? 'bg-received-600 hover:bg-received-700 disabled:opacity-40'
                  : 'bg-given-600 hover:bg-given-700 disabled:opacity-40'
              } text-white shadow-lg active:scale-[0.98]`}
              id="function-mode-save"
            >
              {mutation.isPending ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="h-6 w-6" />
                  Save & Next
                </>
              )}
            </button>
          </form>
        )}

        {/* Empty state when no search */}
        {!search && !selectedPerson && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search className="h-7 w-7 text-gray-600" />
            </div>
            <p className="text-gray-500 font-medium">Search for a person to begin</p>
            <p className="text-gray-600 text-sm mt-1">
              Type a name, area, or phone number
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
