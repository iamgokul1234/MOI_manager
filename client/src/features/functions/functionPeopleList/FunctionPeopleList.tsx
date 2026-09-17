import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Edit2, MoreVertical, Plus, Trash2, Users, Zap } from 'lucide-react';
import { functionsApi, type FunctionPeopleQuery } from '@/api/functions';
import { peopleApi } from '@/api/people';
import { transactionsApi } from '@/api/transactions';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button, IconButton } from '@/components/ui/Button';
import { SearchBar } from '@/components/ui/SearchBar';
import { Select } from '@/components/ui/Select';
import { SegmentedControl } from '@/components/ui/Tabs';
import { AttendedToggle } from '@/components/ui/AttendedToggle';
import { Avatar } from '@/components/ui/Avatar';
import { TransactionBadge } from '@/components/ui/Badge';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { ListSkeleton } from '@/components/ui/LoadingSkeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { cn, formatCurrency, formatDate, getErrorMessage, getInitial, getPersonName } from '@/lib/utils';
import { invalidateMoiData, qk } from '@/lib/queryClient';
import type { ApiResponse, FunctionEvent, FunctionPersonRow, Transaction } from '@/types';
import { EditTransactionModal } from '@/features/transactions/EditTransactionModal';

type AttendedFilter = 'all' | 'attended' | 'not';

interface Props {
  fn: FunctionEvent;
  /** Relative functions use a compact ledger without filters. */
  compact?: boolean;
  onAddMoi?: () => void;
  onAddPerson?: () => void;
}

/**
 * THE core screen of the app. Every person with an entry under this function,
 * with amount, type and a big "Attended" tick. Ticking strikes the row through
 * (live checklist). Search/filter are scoped to this function and never hide
 * or reset the attended styling — it travels with each row from the API.
 */
export const FunctionPeopleList: React.FC<Props> = ({ fn, compact = false, onAddMoi, onAddPerson }) => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { success, error } = useToast();

  const [search, setSearch] = useState('');
  const [area, setArea] = useState('');
  const [type, setType] = useState<'' | 'RECEIVED' | 'GIVEN'>('');
  const [attendedFilter, setAttendedFilter] = useState<AttendedFilter>('all');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<FunctionPersonRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<FunctionPersonRow | null>(null);
  const [confirmCheckRow, setConfirmCheckRow] = useState<FunctionPersonRow | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const filters: FunctionPeopleQuery = useMemo(
    () => ({
      search,
      area,
      type,
      attended: attendedFilter === 'all' ? '' : attendedFilter === 'attended' ? 'true' : 'false',
    }),
    [search, area, type, attendedFilter]
  );

  const listKey = [...qk.functionPeople(fn._id), filters];

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: listKey,
    queryFn: () => functionsApi.getPeople(fn._id, filters),
    placeholderData: (prev) => prev,
  });

  const { data: areas } = useQuery({
    queryKey: qk.areas,
    queryFn: () => peopleApi.getAreas().then((r) => r.data),
    enabled: !compact,
    staleTime: 5 * 60_000,
  });

  const rows = data?.data ?? [];

  // ---- Optimistic attendance toggle ------------------------------------
  const toggle = useMutation({
    mutationFn: ({ id, attended }: { id: string; attended: boolean }) =>
      transactionsApi.setAttendance(id, attended),
    onMutate: async ({ id, attended }) => {
      setPendingId(id);
      await qc.cancelQueries({ queryKey: qk.functionPeople(fn._id) });
      const previous = qc.getQueriesData<ApiResponse<FunctionPersonRow[]>>({
        queryKey: qk.functionPeople(fn._id),
      });
      qc.setQueriesData<ApiResponse<FunctionPersonRow[]>>(
        { queryKey: qk.functionPeople(fn._id) },
        (old) =>
          old
            ? { ...old, data: old.data.map((r) => (r.transactionId === id ? { ...r, attended } : r)) }
            : old
      );
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      ctx?.previous.forEach(([key, value]) => qc.setQueryData(key, value));
      error(getErrorMessage(err, 'Could not update attendance'));
    },
    onSettled: () => {
      setPendingId(null);
      qc.invalidateQueries({ queryKey: qk.functionPeople(fn._id) });
      qc.invalidateQueries({ queryKey: qk.transactions });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => transactionsApi.delete(id),
    onSuccess: () => {
      success('Moi entry deleted');
      setDeleteRow(null);
      invalidateMoiData(qc, { functionId: fn._id });
    },
    onError: (err) => error(getErrorMessage(err, 'Could not delete the entry')),
  });

  const activeFilters =
    (search ? 1 : 0) + (area ? 1 : 0) + (type ? 1 : 0) + (attendedFilter !== 'all' ? 1 : 0);

  const attendedCount = rows.filter((r) => r.attended).length;

  const toTransaction = (row: FunctionPersonRow): Transaction => ({
    _id: row.transactionId,
    userId: fn.userId,
    personId: { ...row.person, userId: fn.userId, isDeleted: false, createdAt: '', updatedAt: '' },
    functionId: fn,
    type: row.type,
    amount: row.amount,
    transactionDate: row.transactionDate,
    attended: row.attended,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.createdAt,
  });

  return (
    <Card padding="none" className="overflow-visible">
      <CardHeader
        title={compact ? 'Moi given at this function' : 'People'}
        subtitle={
          isLoading
            ? 'Loading…'
            : rows.length === 0
              ? undefined
              : compact
                ? `${rows.length} ${rows.length === 1 ? 'entry' : 'entries'}`
                : `${attendedCount} of ${rows.length} checked${activeFilters ? ' (filtered)' : ''}`
        }
        action={
          <div className="flex items-center gap-2">
            {onAddPerson && (
              <Button
                size="sm"
                icon={<Plus className="h-4 w-4" />}
                onClick={onAddPerson}
                id="add-person-to-function-btn"
              >
                Add Person
              </Button>
            )}
            {!compact && (
              <Link to={`/functions/${fn._id}/mode`}>
                <Button
                  size="sm"
                  variant="outline"
                  icon={<Zap className="h-4 w-4 text-amber-500" />}
                  id="enter-function-mode-btn"
                >
                  Function Mode
                </Button>
              </Link>
            )}
            {compact && onAddMoi && (
              <Button
                size="sm"
                icon={<Plus className="h-4 w-4" />}
                onClick={onAddMoi}
                id="add-moi-btn"
              >
                Add Moi
              </Button>
            )}
          </div>
        }
      />

      {!compact && (
        <div className="px-4 sm:px-5 py-4 border-b border-gray-100 space-y-3 bg-gray-50/50">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by name, area or phone…"
            id="function-people-search"
          />
          <div className="flex gap-2 flex-wrap items-end">
            <SegmentedControl<AttendedFilter>
              aria-label="Status filter"
              value={attendedFilter}
              onChange={setAttendedFilter}
              className="w-full sm:flex-1 sm:min-w-[260px]"
              options={[
                { value: 'all', label: 'All' },
                { value: 'attended', label: 'Checked' },
                { value: 'not', label: 'Unchecked' },
              ]}
            />
            <Select
              aria-label="Type"
              options={[
                { value: '', label: 'Received & Given' },
                { value: 'RECEIVED', label: 'Received only' },
                { value: 'GIVEN', label: 'Given only' },
              ]}
              value={type}
              onChange={(e) => setType(e.target.value as '' | 'RECEIVED' | 'GIVEN')}
              className="w-full sm:w-44"
            />
            {areas && areas.length > 0 && (
              <Select
                aria-label="Area"
                options={[{ value: '', label: 'All areas' }, ...areas.map((a) => ({ value: a, label: a }))]}
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full sm:w-40"
              />
            )}
            {activeFilters > 0 && (
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  setSearch('');
                  setArea('');
                  setType('');
                  setAttendedFilter('all');
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      )}

      {isLoading ? (
        <ListSkeleton rows={5} />
      ) : isError ? (
        <ErrorState compact message="Could not load people for this function." onRetry={() => refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          compact
          icon={<Users className="h-8 w-8" />}
          title={activeFilters ? 'No one matches these filters' : 'No one recorded yet'}
          description={
            activeFilters
              ? 'Try clearing the search or filters.'
              : compact
                ? 'If you gave Moi at this function, add it here so it shows in the person’s history.'
                : 'Click "Add Person" to add someone via modal, or use "Function Mode" for fast real-time entry.'
          }
          action={
            !activeFilters && (
              <div className="flex items-center gap-2 justify-center flex-wrap">
                {onAddPerson && (
                  <Button onClick={onAddPerson} icon={<Plus className="h-4 w-4" />}>
                    Add Person
                  </Button>
                )}
                {!compact && (
                  <Link to={`/functions/${fn._id}/mode`}>
                    <Button variant="outline" icon={<Zap className="h-4 w-4 text-amber-500" />}>
                      Enter Function Mode
                    </Button>
                  </Link>
                )}
                {compact && onAddMoi && (
                  <Button onClick={onAddMoi} icon={<Plus className="h-4 w-4" />}>
                    Add Moi
                  </Button>
                )}
              </div>
            )
          }
        />
      ) : (
        <ul className={cn('divide-y divide-gray-100', isFetching && 'opacity-90')} role="list">
          {rows.map((row) => {
            const struck = row.attended;
            return (
              <li
                key={row.transactionId}
                className={cn(
                  'flex items-center gap-3 px-3 sm:px-5 py-3 transition-colors cursor-pointer',
                  struck ? 'bg-gray-50/70' : 'hover:bg-gray-50'
                )}
                onClick={() => navigate(`/people/${row.person._id}`)}
              >
                {!compact && (
                  <AttendedToggle
                    attended={row.attended}
                    pending={pendingId === row.transactionId}
                    onToggle={() => {
                      if (!row.attended) {
                        setConfirmCheckRow(row);
                      }
                    }}
                    label={`${getPersonName(row.person)}: ${row.attended ? 'checked (locked)' : 'check row'}`}
                  />
                )}

                <Avatar initial={getInitial(row.person)} size="md" tone={struck ? 'gray' : 'primary'} />

                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'font-semibold truncate transition-colors',
                      struck ? 'line-through text-gray-400' : 'text-gray-900'
                    )}
                  >
                    {getPersonName(row.person)}
                  </p>
                  <p className={cn('text-sm truncate', struck ? 'text-gray-400' : 'text-gray-500')}>
                    {row.person.area}
                    {compact && ` · ${formatDate(row.transactionDate)}`}
                    {row.notes && <span className="italic"> · {row.notes}</span>}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p
                    className={cn(
                      'font-bold tabular-nums',
                      struck
                        ? 'line-through text-gray-400'
                        : row.type === 'RECEIVED'
                          ? 'text-received-700'
                          : 'text-given-700'
                    )}
                  >
                    {formatCurrency(row.amount)}
                  </p>
                  <TransactionBadge type={row.type} className={cn(struck && 'opacity-60')} />
                </div>

                <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                  <IconButton
                    label="More actions"
                    onClick={() => setMenuFor(menuFor === row.transactionId ? null : row.transactionId)}
                    aria-haspopup="menu"
                    aria-expanded={menuFor === row.transactionId}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </IconButton>
                  {menuFor === row.transactionId && (
                    <div
                      role="menu"
                      className="absolute right-0 top-10 z-30 w-44 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden animate-fade-in"
                      onMouseLeave={() => setMenuFor(null)}
                    >
                      <button
                        type="button"
                        role="menuitem"
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => {
                          setMenuFor(null);
                          navigate(`/people/${row.person._id}`);
                        }}
                      >
                        <ChevronRight className="h-4 w-4" /> View person
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => {
                          setMenuFor(null);
                          setEditRow(row);
                        }}
                      >
                        <Edit2 className="h-4 w-4" /> Edit entry
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setMenuFor(null);
                          setDeleteRow(row);
                        }}
                      >
                        <Trash2 className="h-4 w-4" /> Delete entry
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <EditTransactionModal
        isOpen={!!editRow}
        onClose={() => setEditRow(null)}
        transaction={editRow ? toTransaction(editRow) : null}
      />

      <ConfirmDialog
        isOpen={!!deleteRow}
        onClose={() => setDeleteRow(null)}
        onConfirm={() => deleteRow && deleteMutation.mutate(deleteRow.transactionId)}
        title="Delete this Moi entry?"
        message={
          deleteRow
            ? `${getPersonName(deleteRow.person)} · ${formatCurrency(deleteRow.amount)} ${
                deleteRow.type === 'RECEIVED' ? 'received' : 'given'
              } at ${fn.name}.\n\nThis removes the entry from every total.`
            : ''
        }
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />

      <ConfirmDialog
        isOpen={!!confirmCheckRow}
        onClose={() => setConfirmCheckRow(null)}
        onConfirm={() => {
          if (confirmCheckRow) {
            toggle.mutate({ id: confirmCheckRow.transactionId, attended: true });
            setConfirmCheckRow(null);
          }
        }}
        title="Mark as Checked?"
        message={
          confirmCheckRow
            ? `Are you sure you want to mark ${getPersonName(confirmCheckRow.person)} as checked?\n\nOnce checked, this action cannot be undone.`
            : ''
        }
        confirmLabel="Yes, Mark Checked"
        cancelLabel="Cancel"
        variant="warning"
        loading={toggle.isPending}
      />
    </Card>
  );
};
