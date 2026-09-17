import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Download,
  Phone,
  MapPin,
  ArrowDown,
  ArrowUp,
} from 'lucide-react';
import { peopleApi } from '@/api/people';
import { Button } from '@/components/ui/Button';
import { SearchBar } from '@/components/ui/SearchBar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Pagination } from '@/components/ui/Pagination';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, formatDate, getPersonName } from '@/lib/utils';
import { AddEditPersonModal } from './AddEditPersonModal';
import { AddMoiModal } from '@/features/transactions/AddMoiModal';
import type { Person } from '@/types';

export const PeoplePage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editPerson, setEditPerson] = useState<Person | null>(null);
  const [deletePerson, setDeletePerson] = useState<Person | null>(null);
  const [addMoiPerson, setAddMoiPerson] = useState<string | null>(null);
  const [confirmWithTransactions, setConfirmWithTransactions] = useState(false);

  const { success, error: toastError } = useToast();
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['people', { search, page }],
    queryFn: () => peopleApi.list({ search, page, limit: 20 }).then((r) => r),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, confirm }: { id: string; confirm?: boolean }) =>
      peopleApi.delete(id, confirm),
    onSuccess: (res, { confirm }) => {
      if (res.data?.requiresConfirmation && !confirm) {
        setConfirmWithTransactions(true);
        return;
      }
      success('Person deleted successfully');
      setDeletePerson(null);
      setConfirmWithTransactions(false);
      qc.invalidateQueries({ queryKey: ['people'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: () => toastError('Failed to delete person'),
  });

  const handleDelete = () => {
    if (!deletePerson) return;
    deleteMutation.mutate({ id: deletePerson._id, confirm: confirmWithTransactions });
  };

  const downloadCSV = () => {
    window.open('/api/export/people.csv', '_blank');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">People</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {data?.pagination?.total ?? '—'} families tracked
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={<Download className="h-4 w-4" />} onClick={downloadCSV}>
            Export
          </Button>
          <Button
            id="add-person-btn"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setShowAddModal(true)}
          >
            Add Person
          </Button>
        </div>
      </div>

      {/* Search */}
      <SearchBar
        value={search}
        onChange={(v) => { setSearch(v); setPage(1); }}
        placeholder="Search by name, area, phone…"
        className="max-w-md"
      />

      {/* Table/Cards */}
      {isLoading ? (
        <Card>
          <TableSkeleton rows={6} cols={5} />
        </Card>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data?.data.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="No people added yet"
          description="Add your first family to start tracking Moi"
          action={
            <Button onClick={() => setShowAddModal(true)} icon={<Plus className="h-4 w-4" />}>
              Add your first family
            </Button>
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <Card padding="none">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Family
                      </th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Area
                      </th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Phone
                      </th>
                      <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Received
                      </th>
                      <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Given
                      </th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Last Tx
                      </th>
                      <th className="px-5 py-3.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data!.data.map((person) => (
                      <tr key={person._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-primary-700">
                                {(person.husbandName || person.wifeName || '?')
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{getPersonName(person)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-gray-600">{person.area}</td>
                        <td className="px-5 py-3.5 text-gray-500">{person.phone || '—'}</td>
                        <td className="px-5 py-3.5 text-right">
                          {person.totalReceived ? (
                            <span className="text-received-700 font-semibold">
                              {formatCurrency(person.totalReceived)}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {person.totalGiven ? (
                            <span className="text-given-700 font-semibold">
                              {formatCurrency(person.totalGiven)}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 text-xs">
                          {formatDate(person.lastTransaction)}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1 justify-end">
                            <Link
                              to={`/people/${person._id}`}
                              className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => setEditPerson(person)}
                              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setAddMoiPerson(person._id)}
                              className="p-1.5 text-gray-400 hover:text-received-600 hover:bg-received-50 rounded-lg transition-colors"
                              title="Add Moi"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => { setDeletePerson(person); setConfirmWithTransactions(false); }}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {data!.data.map((person) => (
              <Card key={person._id} padding="sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary-700">
                      {(person.husbandName || person.wifeName || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{getPersonName(person)}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {person.area}
                      </span>
                      {person.phone && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {person.phone}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      {(person.totalReceived || 0) > 0 && (
                        <span className="text-xs font-semibold text-received-600 flex items-center gap-1">
                          <ArrowDown className="h-3 w-3" />
                          {formatCurrency(person.totalReceived || 0)}
                        </span>
                      )}
                      {(person.totalGiven || 0) > 0 && (
                        <span className="text-xs font-semibold text-given-600 flex items-center gap-1">
                          <ArrowUp className="h-3 w-3" />
                          {formatCurrency(person.totalGiven || 0)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Link
                      to={`/people/${person._id}`}
                      className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => setEditPerson(person)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {data!.pagination && (
            <Pagination pagination={data!.pagination} onPageChange={setPage} />
          )}
        </>
      )}

      {/* Modals */}
      <AddEditPersonModal
        isOpen={showAddModal || !!editPerson}
        onClose={() => { setShowAddModal(false); setEditPerson(null); }}
        person={editPerson}
      />

      <AddMoiModal
        isOpen={!!addMoiPerson}
        onClose={() => setAddMoiPerson(null)}
        prefillPersonId={addMoiPerson || undefined}
      />

      <ConfirmDialog
        isOpen={!!deletePerson && !confirmWithTransactions}
        onClose={() => setDeletePerson(null)}
        onConfirm={handleDelete}
        title="Delete Person"
        message={`Are you sure you want to delete ${getPersonName(deletePerson)}? This action will soft-delete them and hide them from your records.`}
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />

      <ConfirmDialog
        isOpen={!!deletePerson && confirmWithTransactions}
        onClose={() => { setDeletePerson(null); setConfirmWithTransactions(false); }}
        onConfirm={handleDelete}
        title="Person Has Transactions"
        message={`${getPersonName(deletePerson)} has existing transaction history. They will be hidden from your records but their history will remain. Are you sure you want to proceed?`}
        confirmLabel="Delete Anyway"
        variant="warning"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};
