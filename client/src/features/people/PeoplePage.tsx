import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Download, Edit2, MapPin, Phone, Plus, Trash2, Users } from 'lucide-react';
import { peopleApi, type PeopleQuery, type PeopleSort } from '@/api/people';
import { Button, IconButton } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { FilterBar, FilterField } from '@/components/ui/FilterBar';
import { SearchBar } from '@/components/ui/SearchBar';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { Pagination } from '@/components/ui/Pagination';
import { useToast } from '@/components/ui/Toast';
import { downloadCsv } from '@/lib/axios';
import { formatCurrency, formatDate, getErrorMessage, getInitial, getPersonName } from '@/lib/utils';
import { qk } from '@/lib/queryClient';
import { AddEditPersonModal } from './AddEditPersonModal';
import { useDeletePerson } from './useDeletePerson';
import { DeletePersonDialog } from './DeletePersonDialog';
import { AddMoiModal } from '@/features/transactions/AddMoiModal';
import type { Person } from '@/types';

const sortOptions: { value: PeopleSort; label: string }[] = [
  { value: 'recent', label: 'Recently added' },
  { value: 'active', label: 'Recently active' },
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'area', label: 'Area (A–Z)' },
  { value: 'received', label: 'Most received' },
  { value: 'given', label: 'Most given' },
];

const emptyFilters: PeopleQuery = {
  area: '',
  hasTransactions: '',
  minReceived: '',
  maxReceived: '',
  minGiven: '',
  maxGiven: '',
  sort: 'recent',
};

/**
 * Global People directory — the master list and cross-function history.
 * Day-to-day Moi entry happens inside Functions, not here.
 */
export const PeoplePage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<PeopleQuery>(emptyFilters);
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [editPerson, setEditPerson] = useState<Person | null>(null);
  const [addMoiFor, setAddMoiFor] = useState<Person | null>(null);
  const [exporting, setExporting] = useState(false);
  const { error } = useToast();
  const del = useDeletePerson();

  const query: PeopleQuery = { ...filters, search, page, limit: 20 };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [...qk.people, 'list', query],
    queryFn: () => peopleApi.list(query),
    placeholderData: (prev) => prev,
  });

  const { data: areas } = useQuery({
    queryKey: qk.areas,
    queryFn: () => peopleApi.getAreas().then((r) => r.data),
    staleTime: 5 * 60_000,
  });

  const set = (patch: Partial<PeopleQuery>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  const activeCount =
    Object.entries(filters).filter(([k, v]) => k !== 'sort' && v !== '' && v !== undefined).length +
    (filters.sort !== 'recent' ? 1 : 0) +
    (search ? 1 : 0);

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadCsv('/export/people.csv', 'people.csv');
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
        title="People"
        subtitle={
          data?.pagination
            ? `${data.pagination.total} ${data.pagination.total === 1 ? 'family' : 'families'} in your Moi book`
            : 'Families you exchange Moi with'
        }
        actions={
          <>
            <Button variant="outline" icon={<Download className="h-4 w-4" />} onClick={handleExport} loading={exporting}>
              Export
            </Button>
            <Button id="add-person-btn" icon={<Plus className="h-4 w-4" />} onClick={() => setShowAdd(true)}>
              Add Person
            </Button>
          </>
        }
      />

      <FilterBar
        activeCount={activeCount}
        onClear={() => {
          setSearch('');
          setFilters(emptyFilters);
          setPage(1);
        }}
        primary={
          <SearchBar
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search by name, area or phone…"
          />
        }
      >
        <FilterField label="Area">
          <Select
            options={[{ value: '', label: 'All areas' }, ...(areas || []).map((a) => ({ value: a, label: a }))]}
            value={filters.area || ''}
            onChange={(e) => set({ area: e.target.value })}
          />
        </FilterField>
        <FilterField label="Moi history">
          <Select
            options={[
              { value: '', label: 'Everyone' },
              { value: 'true', label: 'Has entries' },
              { value: 'false', label: 'No entries yet' },
            ]}
            value={filters.hasTransactions || ''}
            onChange={(e) => set({ hasTransactions: e.target.value as PeopleQuery['hasTransactions'] })}
          />
        </FilterField>
        <FilterField label="Sort by">
          <Select
            options={sortOptions}
            value={filters.sort || 'recent'}
            onChange={(e) => set({ sort: e.target.value as PeopleSort })}
          />
        </FilterField>
        <FilterField label="Received between">
          <div className="flex gap-2">
            <Input type="number" inputMode="numeric" placeholder="Min" min="0" value={filters.minReceived || ''} onChange={(e) => set({ minReceived: e.target.value })} />
            <Input type="number" inputMode="numeric" placeholder="Max" min="0" value={filters.maxReceived || ''} onChange={(e) => set({ maxReceived: e.target.value })} />
          </div>
        </FilterField>
        <FilterField label="Given between">
          <div className="flex gap-2">
            <Input type="number" inputMode="numeric" placeholder="Min" min="0" value={filters.minGiven || ''} onChange={(e) => set({ minGiven: e.target.value })} />
            <Input type="number" inputMode="numeric" placeholder="Max" min="0" value={filters.maxGiven || ''} onChange={(e) => set({ maxGiven: e.target.value })} />
          </div>
        </FilterField>
      </FilterBar>

      {isLoading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : isError ? (
        <ErrorState message="Could not load people." onRetry={() => refetch()} />
      ) : rows.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title={activeCount ? 'No one matches' : 'No people yet'}
            description={
              activeCount
                ? 'Try a different search or clear the filters.'
                : 'Add the families you exchange Moi with. You can also add people on the spot from Function Mode.'
            }
            action={
              !activeCount && (
                <Button onClick={() => setShowAdd(true)} icon={<Plus className="h-4 w-4" />}>
                  Add your first family
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <DataTable<Person>
          rows={rows}
          rowKey={(p) => p._id}
          onRowClick={(p) => navigate(`/people/${p._id}`)}
          columns={[
            {
              key: 'family',
              header: 'Family',
              render: (p) => (
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar initial={getInitial(p)} size="sm" />
                  <p className="font-semibold text-gray-900 truncate">{getPersonName(p)}</p>
                </div>
              ),
            },
            { key: 'area', header: 'Area', width: '140px', render: (p) => <span className="text-gray-700">{p.area}</span> },
            { key: 'phone', header: 'Phone', width: '130px', render: (p) => <span className="text-gray-500">{p.phone || '—'}</span> },
            {
              key: 'received',
              header: 'Received',
              align: 'right',
              width: '120px',
              render: (p) =>
                p.totalReceived ? <span className="text-received-700 font-semibold">{formatCurrency(p.totalReceived)}</span> : <span className="text-gray-400">—</span>,
            },
            {
              key: 'given',
              header: 'Given',
              align: 'right',
              width: '120px',
              render: (p) =>
                p.totalGiven ? <span className="text-given-700 font-semibold">{formatCurrency(p.totalGiven)}</span> : <span className="text-gray-400">—</span>,
            },
            { key: 'last', header: 'Last Moi', width: '120px', render: (p) => <span className="text-gray-500 text-xs">{formatDate(p.lastTransaction)}</span> },
            {
              key: 'actions',
              header: <span className="sr-only">Actions</span>,
              align: 'right',
              width: '150px',
              render: (p) => (
                <div className="flex items-center gap-0.5 justify-end" onClick={(e) => e.stopPropagation()}>
                  <IconButton label="Add Moi" tone="primary" onClick={() => setAddMoiFor(p)}>
                    <Plus className="h-4 w-4" />
                  </IconButton>
                  <IconButton label="Edit" onClick={() => setEditPerson(p)}>
                    <Edit2 className="h-4 w-4" />
                  </IconButton>
                  <IconButton label="Delete" tone="danger" onClick={() => del.request(p)}>
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </div>
              ),
            },
          ]}
          renderMobileCard={(p) => (
            <Card padding="sm" className="flex items-start gap-3">
              <Avatar initial={getInitial(p)} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{getPersonName(p)}</p>
                <div className="flex items-center gap-3 mt-0.5 text-sm text-gray-500 flex-wrap">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {p.area}
                  </span>
                  {p.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" /> {p.phone}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm font-semibold">
                  <span className="text-received-700">Received {formatCurrency(p.totalReceived || 0)}</span>
                  <span className="text-given-700">Given {formatCurrency(p.totalGiven || 0)}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5 -mr-2" onClick={(e) => e.stopPropagation()}>
                <IconButton label="Add Moi" tone="primary" onClick={() => setAddMoiFor(p)}>
                  <Plus className="h-4 w-4" />
                </IconButton>
                <Link
                  to={`/people/${p._id}`}
                  className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-gray-400 hover:text-gray-800 hover:bg-gray-100"
                  aria-label="View"
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </Card>
          )}
          footer={data?.pagination && <Pagination pagination={data.pagination} onPageChange={setPage} />}
        />
      )}

      <AddEditPersonModal
        isOpen={showAdd || !!editPerson}
        onClose={() => {
          setShowAdd(false);
          setEditPerson(null);
        }}
        person={editPerson}
      />

      <AddMoiModal isOpen={!!addMoiFor} onClose={() => setAddMoiFor(null)} prefillPerson={addMoiFor} />

      <DeletePersonDialog state={del} />
    </div>
  );
};
