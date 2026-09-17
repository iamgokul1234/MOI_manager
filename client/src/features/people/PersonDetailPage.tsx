import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Edit2,
  History,
  Home,
  MapPin,
  Phone,
  Plus,
  StickyNote,
  Trash2,
} from 'lucide-react';
import { peopleApi } from '@/api/people';
import { transactionsApi } from '@/api/transactions';
import { Card, CardHeader, StatCard } from '@/components/ui/Card';
import { Button, IconButton } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { AttendedBadge, CategoryBadge, FunctionTypeBadge, TransactionBadge } from '@/components/ui/Badge';
import { StatCardSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { cn, formatCurrency, formatDate, getErrorMessage, getInitial, getPersonName, isPopulated } from '@/lib/utils';
import { invalidateMoiData, qk } from '@/lib/queryClient';
import { AddEditPersonModal } from './AddEditPersonModal';
import { useDeletePerson } from './useDeletePerson';
import { DeletePersonDialog } from './DeletePersonDialog';
import { AddMoiModal } from '@/features/transactions/AddMoiModal';
import { EditTransactionModal } from '@/features/transactions/EditTransactionModal';
import type { Transaction } from '@/types';

export const PersonDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { success, error } = useToast();
  const [showEdit, setShowEdit] = useState(false);
  const [showAddMoi, setShowAddMoi] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [deleteTx, setDeleteTx] = useState<Transaction | null>(null);
  const del = useDeletePerson(() => navigate('/people', { replace: true }));

  const { data: person, isLoading, isError, refetch } = useQuery({
    queryKey: qk.person(id!),
    queryFn: () => peopleApi.getById(id!).then((r) => r.data),
    enabled: !!id,
  });

  const deleteTxMutation = useMutation({
    mutationFn: (txId: string) => transactionsApi.delete(txId),
    onSuccess: () => {
      success('Moi entry deleted');
      setDeleteTx(null);
      invalidateMoiData(qc, { personId: id });
    },
    onError: (err) => error(getErrorMessage(err, 'Could not delete the entry')),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-6 w-32" />
        <div className="skeleton h-24 w-full rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !person) {
    return <ErrorState message="Could not load this person." onRetry={() => refetch()} />;
  }

  const txs = person.transactions || [];

  return (
    <div className="space-y-6">
      <PageHeader
        backTo="/people"
        backLabel="People"
        title={getPersonName(person)}
        subtitle={
          <span className="inline-flex items-center gap-4 flex-wrap mt-1">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {person.area}
            </span>
            {person.phone && (
              <a href={`tel:${person.phone}`} className="inline-flex items-center gap-1 hover:text-primary-700">
                <Phone className="h-3.5 w-3.5" /> {person.phone}
              </a>
            )}
            {person.alternatePhone && (
              <a href={`tel:${person.alternatePhone}`} className="inline-flex items-center gap-1 hover:text-primary-700">
                <Phone className="h-3.5 w-3.5" /> {person.alternatePhone}
              </a>
            )}
          </span>
        }
        actions={
          <>
            <Button variant="outline" icon={<Edit2 className="h-4 w-4" />} onClick={() => setShowEdit(true)}>
              Edit
            </Button>
            <Button variant="outline" icon={<Trash2 className="h-4 w-4" />} onClick={() => del.request(person)}>
              Remove
            </Button>
            <Button id="person-add-moi-btn" icon={<Plus className="h-4 w-4" />} onClick={() => setShowAddMoi(true)}>
              Add Transaction
            </Button>
          </>
        }
      />

      {(person.address || person.notes) && (
        <Card className="text-sm text-gray-600 space-y-2">
          {person.address && (
            <p className="flex items-start gap-2">
              <Home className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" /> {person.address}
            </p>
          )}
          {person.notes && (
            <p className="flex items-start gap-2 whitespace-pre-line">
              <StickyNote className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" /> {person.notes}
            </p>
          )}
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Received"
          value={formatCurrency(person.totalReceived || 0)}
          icon={<ArrowDownLeft className="h-5 w-5 text-received-600" />}
          iconBg="bg-received-50"
        />
        <StatCard
          label="Total Given"
          value={formatCurrency(person.totalGiven || 0)}
          icon={<ArrowUpRight className="h-5 w-5 text-given-600" />}
          iconBg="bg-given-50"
        />
        <StatCard
          label="Functions"
          value={person.totalFunctions || 0}
          icon={<CalendarDays className="h-5 w-5 text-primary-600" />}
          iconBg="bg-primary-50"
        />
        <StatCard
          label="Last Transaction"
          value={person.lastTransaction ? formatDate(person.lastTransaction) : '—'}
          icon={<History className="h-5 w-5 text-gray-500" />}
          iconBg="bg-gray-100"
        />
      </div>

      <Card padding="none">
        <CardHeader
          title="Moi history"
          subtitle={`${txs.length} ${txs.length === 1 ? 'entry' : 'entries'} across all functions`}
        />
        {txs.length === 0 ? (
          <EmptyState
            compact
            icon={<History className="h-8 w-8" />}
            title="No Moi recorded yet"
            description="Add the first entry for this family."
            action={
              <Button onClick={() => setShowAddMoi(true)} icon={<Plus className="h-4 w-4" />}>
                Add Transaction
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-gray-100" role="list">
            {txs.map((t) => {
              const fn = isPopulated(t.functionId) ? t.functionId : null;
              return (
                <li key={t._id} className="px-4 sm:px-5 py-3.5 flex items-center gap-3">
                  <Avatar initial={getInitial(person)} size="sm" tone="gray" className="hidden sm:flex" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {fn ? (
                        <Link to={`/functions/${fn._id}`} className="font-semibold text-gray-900 hover:text-primary-700 truncate">
                          {fn.name}
                        </Link>
                      ) : (
                        <span className="font-semibold text-gray-400">Function removed</span>
                      )}
                      {fn?.type && <FunctionTypeBadge type={fn.type} />}
                      {fn?.category && <CategoryBadge category={fn.category} />}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap text-sm text-gray-500">
                      <span>{formatDate(t.transactionDate)}</span>
                      <AttendedBadge attended={t.attended} />
                      {t.notes && <span className="italic truncate">{t.notes}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn('font-bold tabular-nums', t.type === 'RECEIVED' ? 'text-received-700' : 'text-given-700')}>
                      {formatCurrency(t.amount)}
                    </p>
                    <TransactionBadge type={t.type} />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-0.5 shrink-0 -mr-1">
                    <IconButton label="Edit entry" onClick={() => setEditTx({ ...t, personId: person })}>
                      <Edit2 className="h-4 w-4" />
                    </IconButton>
                    <IconButton label="Delete entry" tone="danger" onClick={() => setDeleteTx(t)}>
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <AddEditPersonModal isOpen={showEdit} onClose={() => setShowEdit(false)} person={person} />
      <AddMoiModal isOpen={showAddMoi} onClose={() => setShowAddMoi(false)} prefillPerson={person} />
      <EditTransactionModal isOpen={!!editTx} onClose={() => setEditTx(null)} transaction={editTx} />
      <ConfirmDialog
        isOpen={!!deleteTx}
        onClose={() => setDeleteTx(null)}
        onConfirm={() => deleteTx && deleteTxMutation.mutate(deleteTx._id)}
        title="Delete this Moi entry?"
        message={deleteTx ? `${formatCurrency(deleteTx.amount)} ${deleteTx.type === 'RECEIVED' ? 'received' : 'given'} on ${formatDate(deleteTx.transactionDate)}.\n\nThis cannot be undone.` : ''}
        confirmLabel="Delete"
        loading={deleteTxMutation.isPending}
      />
      <DeletePersonDialog state={del} />
    </div>
  );
};
