import React, { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, Download, Edit2, Plus, Trash2 } from 'lucide-react';
import { transactionsApi, type TransactionsQuery } from '@/api/transactions';
import { peopleApi } from '@/api/people';
import { functionsApi } from '@/api/functions';
import { Button, IconButton } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { FilterBar, FilterField } from '@/components/ui/FilterBar';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Typeahead } from '@/components/ui/Typeahead';
import { AttendedBadge, CategoryBadge, TransactionBadge } from '@/components/ui/Badge';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Pagination } from '@/components/ui/Pagination';
import { useToast } from '@/components/ui/Toast';
import { downloadCsv } from '@/lib/axios';
import { cn, formatCurrency, formatDate, getErrorMessage, getPersonName, isPopulated } from '@/lib/utils';
import { invalidateMoiData, qk } from '@/lib/queryClient';
import { AddMoiModal } from './AddMoiModal';
import { EditTransactionModal } from './EditTransactionModal';
import type { FunctionEvent, Person, Transaction } from '@/types';

const emptyFilters: TransactionsQuery = {
  type: '',
  area: '',
  attended: '',
  dateFrom: '',
  dateTo: '',
  minAmount: '',
  maxAmount: '',
};

export const TransactionsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<TransactionsQuery>(emptyFilters);
  const [person, setPerson] = useState<Person | null>(null);
  const [fn, setFn] = useState<FunctionEvent | null>(null);
  const [showAddMoi, setShowAddMoi] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [deleteTx, setDeleteTx] = useState<Transaction | null>(null);
  const [exporting, setExporting] = useState(false);

  const { success, error } = useToast();
  const qc = useQueryClient();

  const query: TransactionsQuery = {
    ...filters,
    personId: person?._id,
    functionId: fn?._id,
    page,
    limit: 20,
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [...qk.transactions, 'list', query],
    queryFn: () => transactionsApi.list(query),
    placeholderData: (prev) => prev,
  });

  const { data: areas } = useQuery({
    queryKey: qk.areas,
    queryFn: () => peopleApi.getAreas().then((r) => r.data),
    staleTime: 5 * 60_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => transactionsApi.delete(id),
    onSuccess: () => {
      success('Moi entry deleted');
      setDeleteTx(null);
      invalidateMoiData(qc);
    },
    onError: (err) => error(getErrorMessage(err, 'Could not delete the entry')),
  });

  const set = (patch: Partial<TransactionsQuery>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  const activeCount =
    Object.values(filters).filter((v) => v !== '' && v !== undefined).length + (person ? 1 : 0) + (fn ? 1 : 0);

  const clearAll = () => {
    setFilters(emptyFilters);
    setPerson(null);
    setFn(null);
    setPage(1);
  };

  const searchPeople = useCallback(
    (q: string) => peopleApi.list({ search: q, limit: 8, sort: 'name' }).then((r) => r.data),
    []
  );
  const searchFunctions = useCallback(
    (q: string) => functionsApi.list({ search: q, limit: 8 }).then((r) => r.data),
    []
  );

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadCsv('/export/transactions.csv', 'transactions.csv');
    } catch (err) {
      error(getErrorMessage(err, 'Export failed'));
    } finally {
      setExporting(false);
    }
  };

  const rows = data?.data ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Transactions"
        subtitle={
          data?.pagination ? `${data.pagination.total} Moi ${data.pagination.total === 1 ? 'entry' : 'entries'}` : 'Every Moi entry across all functions'
        }
        actions={
          <>
            <Button variant="outline" icon={<Download className="h-4 w-4" />} onClick={handleExport} loading={exporting}>
              Export
            </Button>
            <Button id="add-transaction-btn" icon={<Plus className="h-4 w-4" />} onClick={() => setShowAddMoi(true)}>
              Add Moi
            </Button>
          </>
        }
      />

      <FilterBar activeCount={activeCount} onClear={clearAll}>
        <FilterField label="From date">
          <Input type="date" value={filters.dateFrom || ''} onChange={(e) => set({ dateFrom: e.target.value })} />
        </FilterField>
        <FilterField label="To date">
          <Input type="date" value={filters.dateTo || ''} onChange={(e) => set({ dateTo: e.target.value })} />
        </FilterField>
        <FilterField label="Person">
          <Typeahead<Person>
            queryKey="tx-filter-people"
            placeholder="Any person"
            value={person}
            onChange={(p) => {
              setPerson(p);
              setPage(1);
            }}
            search={searchPeople}
            getKey={(p) => p._id}
            getLabel={getPersonName}
            renderItem={(p) => (
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{getPersonName(p)}</p>
                <p className="text-xs text-gray-500">{p.area}</p>
              </div>
            )}
          />
        </FilterField>
        <FilterField label="Function">
          <Typeahead<FunctionEvent>
            queryKey="tx-filter-functions"
            placeholder="Any function"
            value={fn}
            onChange={(f) => {
              setFn(f);
              setPage(1);
            }}
            search={searchFunctions}
            getKey={(f) => f._id}
            getLabel={(f) => f.name}
            renderItem={(f) => (
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{f.name}</p>
                <p className="text-xs text-gray-500">{formatDate(f.date)}</p>
              </div>
            )}
          />
        </FilterField>
        <FilterField label="Area">
          <Select
            options={[{ value: '', label: 'All areas' }, ...(areas || []).map((a) => ({ value: a, label: a }))]}
            value={filters.area || ''}
            onChange={(e) => set({ area: e.target.value })}
          />
        </FilterField>
        <FilterField label="Type">
          <Select
            options={[
              { value: '', label: 'Received & Given' },
              { value: 'RECEIVED', label: 'Received' },
              { value: 'GIVEN', label: 'Given' },
            ]}
            value={filters.type || ''}
            onChange={(e) => set({ type: e.target.value as TransactionsQuery['type'] })}
          />
        </FilterField>
        <FilterField label="Attended">
          <Select
            options={[
              { value: '', label: 'Any' },
              { value: 'true', label: 'Attended' },
              { value: 'false', label: 'Not attended' },
            ]}
            value={filters.attended || ''}
            onChange={(e) => set({ attended: e.target.value as TransactionsQuery['attended'] })}
          />
        </FilterField>
        <FilterField label="Amount range">
          <div className="flex gap-2">
            <Input type="number" inputMode="numeric" placeholder="Min" min="0" value={filters.minAmount || ''} onChange={(e) => set({ minAmount: e.target.value })} />
            <Input type="number" inputMode="numeric" placeholder="Max" min="0" value={filters.maxAmount || ''} onChange={(e) => set({ maxAmount: e.target.value })} />
          </div>
        </FilterField>
      </FilterBar>

      {isLoading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : isError ? (
        <ErrorState message="Could not load transactions." onRetry={() => refetch()} />
      ) : rows.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={<ArrowLeftRight className="h-8 w-8" />}
            title={activeCount ? 'No entries match' : 'No Moi entries yet'}
            description={
              activeCount
                ? 'Try widening the date range or clearing the filters.'
                : 'Open one of your functions and use Function Mode, or add an entry here.'
            }
            action={
              activeCount ? (
                <Button variant="outline" onClick={clearAll}>Clear filters</Button>
              ) : (
                <Button onClick={() => setShowAddMoi(true)} icon={<Plus className="h-4 w-4" />}>
                  Add first entry
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <DataTable<Transaction>
          rows={rows}
          rowKey={(t) => t._id}
          columns={[
            {
              key: 'date',
              header: 'Date',
              width: '120px',
              render: (t) => <span className="text-gray-700 whitespace-nowrap">{formatDate(t.transactionDate)}</span>,
            },
            {
              key: 'person',
              header: 'Person',
              render: (t) => {
                const p = isPopulated(t.personId) ? t.personId : null;
                return (
                  <div className="min-w-0">
                    {p ? (
                      <Link to={`/people/${p._id}`} className="font-semibold text-gray-900 hover:text-primary-700 truncate block">
                        {getPersonName(p)}
                      </Link>
                    ) : (
                      <span className="text-gray-400">Unknown</span>
                    )}
                    <p className="text-xs text-gray-500 truncate">{p?.area}</p>
                  </div>
                );
              },
            },
            {
              key: 'function',
              header: 'Function',
              render: (t) => {
                const f = isPopulated(t.functionId) ? t.functionId : null;
                return (
                  <div className="min-w-0">
                    {f ? (
                      <Link to={`/functions/${f._id}`} className="text-gray-900 hover:text-primary-700 truncate block">
                        {f.name}
                      </Link>
                    ) : (
                      <span className="text-gray-400">Unknown</span>
                    )}
                    {f?.category && <CategoryBadge category={f.category} className="mt-1" />}
                  </div>
                );
              },
            },
            { key: 'type', header: 'Type', width: '120px', render: (t) => <TransactionBadge type={t.type} /> },
            { key: 'attended', header: 'Attended', width: '130px', render: (t) => <AttendedBadge attended={t.attended} /> },
            {
              key: 'amount',
              header: 'Amount',
              align: 'right',
              width: '130px',
              render: (t) => (
                <span className={cn('font-bold tabular-nums', t.type === 'RECEIVED' ? 'text-received-700' : 'text-given-700')}>
                  {formatCurrency(t.amount)}
                </span>
              ),
            },
            {
              key: 'actions',
              header: <span className="sr-only">Actions</span>,
              align: 'right',
              width: '100px',
              render: (t) => (
                <div className="flex items-center gap-0.5 justify-end">
                  <IconButton label="Edit" onClick={() => setEditTx(t)}>
                    <Edit2 className="h-4 w-4" />
                  </IconButton>
                  <IconButton label="Delete" tone="danger" onClick={() => setDeleteTx(t)}>
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </div>
              ),
            },
          ]}
          renderMobileCard={(t) => {
            const p = isPopulated(t.personId) ? t.personId : null;
            const f = isPopulated(t.functionId) ? t.functionId : null;
            return (
              <Card padding="sm" className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{getPersonName(p)}</p>
                  <p className="text-sm text-gray-500 truncate">
                    {f?.name} · {formatDate(t.transactionDate)}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <TransactionBadge type={t.type} />
                    <AttendedBadge attended={t.attended} />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn('font-bold tabular-nums', t.type === 'RECEIVED' ? 'text-received-700' : 'text-given-700')}>
                    {formatCurrency(t.amount)}
                  </p>
                  <div className="flex gap-0.5 justify-end mt-1 -mr-2">
                    <IconButton label="Edit" onClick={() => setEditTx(t)}>
                      <Edit2 className="h-4 w-4" />
                    </IconButton>
                    <IconButton label="Delete" tone="danger" onClick={() => setDeleteTx(t)}>
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </div>
                </div>
              </Card>
            );
          }}
          footer={data?.pagination && <Pagination pagination={data.pagination} onPageChange={setPage} />}
        />
      )}

      <AddMoiModal isOpen={showAddMoi} onClose={() => setShowAddMoi(false)} />
      <EditTransactionModal isOpen={!!editTx} onClose={() => setEditTx(null)} transaction={editTx} />

      <ConfirmDialog
        isOpen={!!deleteTx}
        onClose={() => setDeleteTx(null)}
        onConfirm={() => deleteTx && deleteMutation.mutate(deleteTx._id)}
        title="Delete this Moi entry?"
        message={
          deleteTx
            ? `${getPersonName(isPopulated(deleteTx.personId) ? deleteTx.personId : null)} · ${formatCurrency(deleteTx.amount)} ${
                deleteTx.type === 'RECEIVED' ? 'received' : 'given'
              }.\n\nThis removes it from every total and cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};
