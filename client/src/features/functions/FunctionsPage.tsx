import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Calendar, Plus, Eye, Edit2, Trash2, Download, MapPin, Users } from 'lucide-react';
import { functionsApi } from '@/api/functions';
import { Button } from '@/components/ui/Button';
import { SearchBar } from '@/components/ui/SearchBar';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { FunctionTypeBadge } from '@/components/ui/Badge';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Pagination } from '@/components/ui/Pagination';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import { AddEditFunctionModal } from './AddEditFunctionModal';
import type { FunctionEvent } from '@/types';
import { FUNCTION_TYPES } from './constants';

export const FunctionsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editFunction, setEditFunction] = useState<FunctionEvent | null>(null);
  const [deleteFunction, setDeleteFunction] = useState<FunctionEvent | null>(null);

  const { success, error: toastError } = useToast();
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['functions', { search, typeFilter, page }],
    queryFn: () =>
      functionsApi.list({ search, type: typeFilter || undefined, page, limit: 20 }).then((r) => r),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => functionsApi.delete(id),
    onSuccess: () => {
      success('Function deleted successfully');
      setDeleteFunction(null);
      qc.invalidateQueries({ queryKey: ['functions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: () => toastError('Failed to delete function'),
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Functions</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {data?.pagination?.total ?? '—'} events tracked
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<Download className="h-4 w-4" />}
            onClick={() => window.open('/api/export/functions.csv', '_blank')}
          >
            Export
          </Button>
          <Button
            id="add-function-btn"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setShowAddModal(true)}
          >
            Add Function
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <SearchBar
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search functions…"
          className="flex-1 min-w-48"
        />
        <Select
          options={[
            { value: '', label: 'All Types' },
            ...FUNCTION_TYPES.map((t) => ({ value: t, label: t })),
          ]}
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="w-40"
        />
      </div>

      {isLoading ? (
        <Card><TableSkeleton rows={5} cols={5} /></Card>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data?.data.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-8 w-8" />}
          title="No functions added yet"
          description="Add a wedding, housewarming, or any other function"
          action={
            <Button onClick={() => setShowAddModal(true)} icon={<Plus className="h-4 w-4" />}>
              Add your first function
            </Button>
          }
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Card padding="none">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Function</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">People</th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Received</th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Given</th>
                    <th className="px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                   {data!.data.map((fn) => (
                    <tr key={fn._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-900">{fn.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <FunctionTypeBadge type={fn.type} />
                          {fn.location && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />{fn.location}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">{formatDate(fn.date)}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                          <Users className="h-4 w-4 text-gray-400" />
                          {fn.peopleCount || 0}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {fn.received ? (
                          <span className="text-received-700 font-semibold">{formatCurrency(fn.received)}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {fn.given ? (
                          <span className="text-given-700 font-semibold">{formatCurrency(fn.given)}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 justify-end">
                          <Link
                            to={`/functions/${fn._id}`}
                            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => setEditFunction(fn)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteFunction(fn)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {data!.data.map((fn) => (
              <Card key={fn._id} padding="sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                    <Calendar className="h-5 w-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{fn.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <FunctionTypeBadge type={fn.type} />
                      <span className="text-xs text-gray-500">{formatDate(fn.date)}</span>
                    </div>
                    <div className="flex gap-3 mt-2">
                      <span className="text-xs font-semibold text-received-600">
                        +{formatCurrency(fn.received || 0)}
                      </span>
                      <span className="text-xs font-semibold text-given-600">
                        -{formatCurrency(fn.given || 0)}
                      </span>
                    </div>
                  </div>
                  <Link
                    to={`/functions/${fn._id}`}
                    className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>

          {data!.pagination && (
            <Pagination pagination={data!.pagination} onPageChange={setPage} />
          )}
        </>
      )}

      <AddEditFunctionModal
        isOpen={showAddModal || !!editFunction}
        onClose={() => { setShowAddModal(false); setEditFunction(null); }}
        fn={editFunction}
      />

      <ConfirmDialog
        isOpen={!!deleteFunction}
        onClose={() => setDeleteFunction(null)}
        onConfirm={() => deleteFunction && deleteMutation.mutate(deleteFunction._id)}
        title="Delete Function"
        message={`Are you sure you want to delete "${deleteFunction?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};
