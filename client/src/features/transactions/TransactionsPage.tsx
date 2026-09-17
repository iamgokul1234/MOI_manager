import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftRight, Edit2, Trash2, Download, Plus } from 'lucide-react';
import { transactionsApi } from '@/api/transactions';
import { Button } from '@/components/ui/Button';
import { SearchBar } from '@/components/ui/SearchBar';
import { Card } from '@/components/ui/Card';
import { TransactionBadge, FunctionTypeBadge } from '@/components/ui/Badge';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Pagination } from '@/components/ui/Pagination';
import { useToast } from '@/components/ui/Toast';
import { AddMoiModal } from './AddMoiModal';
import { EditTransactionModal } from './EditTransactionModal';
import { formatCurrency, formatDate, getPersonName } from '@/lib/utils';
import type { Transaction, Person, FunctionEvent } from '@/types';

export const TransactionsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [showAddMoi, setShowAddMoi] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [deleteTx, setDeleteTx] = useState<Transaction | null>(null);

  const { success, error: toastError } = useToast();
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['transactions', { page }],
    queryFn: () => transactionsApi.list({ page, limit: 20 }).then((r) => r),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => transactionsApi.delete(id),
    onSuccess: () => {
      success('Transaction deleted successfully');
      setDeleteTx(null);
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['people'] });
      qc.invalidateQueries({ queryKey: ['functions'] });
    },
    onError: () => toastError('Failed to delete transaction'),
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {data?.pagination?.total ?? '—'} total transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<Download className="h-4 w-4" />}
            onClick={() => window.open('/api/export/transactions.csv', '_blank')}
          >
            Export
          </Button>
          <Button
            id="add-transaction-btn"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setShowAddMoi(true)}
          >
            Add Moi
          </Button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <Card><TableSkeleton rows={8} cols={6} /></Card>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data?.data.length === 0 ? (
        <EmptyState
          icon={<ArrowLeftRight className="h-8 w-8" />}
          title="No transactions yet"
          description="Start tracking by adding a Moi transaction"
          action={
            <Button onClick={() => setShowAddMoi(true)} icon={<Plus className="h-4 w-4" />}>
              Add first transaction
            </Button>
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <Card padding="none">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Person</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Function</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                    <th className="px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data!.data.map((t: Transaction) => {
                    const person = t.personId as Person;
                    const fn = t.functionId as FunctionEvent;
                    return (
                      <tr key={t._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5 text-gray-600 text-xs whitespace-nowrap">
                          {formatDate(t.transactionDate)}
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-gray-900">{getPersonName(person)}</p>
                          <p className="text-xs text-gray-500">{person?.area}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-gray-700">{fn?.name}</p>
                          {fn?.type && <FunctionTypeBadge type={fn.type} />}
                        </td>
                        <td className="px-5 py-3.5">
                          <TransactionBadge type={t.type} />
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className={`font-bold ${t.type === 'RECEIVED' ? 'text-received-700' : 'text-given-700'}`}>
                            {t.type === 'RECEIVED' ? '+' : '-'}{formatCurrency(t.amount)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => setEditTx(t)}
                              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTx(t)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {data!.data.map((t: Transaction) => {
              const person = t.personId as Person;
              const fn = t.functionId as FunctionEvent;
              return (
                <Card key={t._id} padding="sm">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${t.type === 'RECEIVED' ? 'bg-received-50' : 'bg-given-50'}`}>
                      {t.type === 'RECEIVED'
                        ? <span className="text-received-600 font-bold text-lg">↓</span>
                        : <span className="text-given-600 font-bold text-lg">↑</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{getPersonName(person)}</p>
                      <p className="text-xs text-gray-500">{fn?.name} · {formatDate(t.transactionDate)}</p>
                      <TransactionBadge type={t.type} />
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-bold ${t.type === 'RECEIVED' ? 'text-received-700' : 'text-given-700'}`}>
                        {formatCurrency(t.amount)}
                      </p>
                      <div className="flex gap-1 justify-end mt-1">
                        <button onClick={() => setEditTx(t)} className="p-1 text-gray-400 hover:text-gray-700">
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setDeleteTx(t)} className="p-1 text-gray-400 hover:text-red-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {data!.pagination && (
            <Pagination pagination={data!.pagination} onPageChange={setPage} />
          )}
        </>
      )}

      <AddMoiModal isOpen={showAddMoi} onClose={() => setShowAddMoi(false)} />
      <EditTransactionModal isOpen={!!editTx} onClose={() => setEditTx(null)} transaction={editTx} />

      <ConfirmDialog
        isOpen={!!deleteTx}
        onClose={() => setDeleteTx(null)}
        onConfirm={() => deleteTx && deleteMutation.mutate(deleteTx._id)}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This cannot be undone."
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};
