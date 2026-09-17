import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, ChevronRight, Edit2, MapPin, Plus, Trash2, Users, Zap } from 'lucide-react';
import { functionsApi } from '@/api/functions';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { IconButton } from '@/components/ui/Button';
import { Button } from '@/components/ui/Button';
import { SearchBar } from '@/components/ui/SearchBar';
import { Select } from '@/components/ui/Select';
import { FilterBar } from '@/components/ui/FilterBar';
import { FunctionTypeBadge } from '@/components/ui/Badge';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { Pagination } from '@/components/ui/Pagination';
import { formatCurrency, formatDate } from '@/lib/utils';
import { qk } from '@/lib/queryClient';
import type { FunctionEvent } from '@/types';
import { FUNCTION_TYPE_OPTIONS } from '../constants';
import { useDeleteFunction } from '../useDeleteFunction';
import { DeleteFunctionDialog } from '../DeleteFunctionDialog';

interface Props {
  onAdd: () => void;
  onEdit: (fn: FunctionEvent) => void;
}

export const OurFunctionsList: React.FC<Props> = ({ onAdd, onEdit }) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const del = useDeleteFunction();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [...qk.functions, 'OUR', { search, type, page }],
    queryFn: () =>
      functionsApi.list({ category: 'OUR', search, type: type || undefined, page, limit: 20 }),
    placeholderData: (prev) => prev,
  });

  const rows = data?.data ?? [];
  const activeCount = (search ? 1 : 0) + (type ? 1 : 0);

  return (
    <div className="space-y-4">
      <FilterBar
        activeCount={activeCount}
        onClear={() => {
          setSearch('');
          setType('');
          setPage(1);
        }}
        primary={
          <SearchBar
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search our functions…"
          />
        }
      >
        <Select
          label="Type"
          options={[{ value: '', label: 'All types' }, ...FUNCTION_TYPE_OPTIONS.filter((o) => o.value !== 'Other')]}
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
        />
      </FilterBar>

      {isLoading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : isError ? (
        <ErrorState message="Could not load your functions." onRetry={() => refetch()} />
      ) : rows.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={<CalendarDays className="h-8 w-8" />}
            title={activeCount ? 'No functions match' : 'No functions yet'}
            description={
              activeCount
                ? 'Try a different search or clear the filters.'
                : 'Add a wedding, housewarming or any event you are hosting. Then open it to record Moi.'
            }
            action={
              !activeCount && (
                <Button onClick={onAdd} icon={<Plus className="h-4 w-4" />}>
                  Add your first function
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <DataTable<FunctionEvent>
          rows={rows}
          rowKey={(f) => f._id}
          onRowClick={(f) => navigate(`/functions/${f._id}`)}
          columns={[
            {
              key: 'name',
              header: 'Function',
              render: (f) => (
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{f.name}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <FunctionTypeBadge type={f.type} />
                    {f.location && (
                      <span className="text-xs text-gray-500 flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {f.location}
                      </span>
                    )}
                  </div>
                </div>
              ),
            },
            { key: 'date', header: 'Date', width: '130px', render: (f) => <span className="text-gray-700">{formatDate(f.date)}</span> },
            {
              key: 'people',
              header: 'People',
              width: '90px',
              render: (f) => (
                <span className="text-gray-700 inline-flex items-center gap-1">
                  <Users className="h-4 w-4 text-gray-400" />
                  {f.peopleCount || 0}
                </span>
              ),
            },
            {
              key: 'received',
              header: 'Received',
              align: 'right',
              width: '130px',
              render: (f) =>
                f.received ? (
                  <span className="text-received-700 font-semibold">{formatCurrency(f.received)}</span>
                ) : (
                  <span className="text-gray-400">—</span>
                ),
            },
            {
              key: 'given',
              header: 'Given',
              align: 'right',
              width: '130px',
              render: (f) =>
                f.given ? (
                  <span className="text-given-700 font-semibold">{formatCurrency(f.given)}</span>
                ) : (
                  <span className="text-gray-400">—</span>
                ),
            },
            {
              key: 'actions',
              header: <span className="sr-only">Actions</span>,
              align: 'right',
              width: '150px',
              render: (f) => (
                <div className="flex items-center gap-0.5 justify-end" onClick={(e) => e.stopPropagation()}>
                  <Link
                    to={`/functions/${f._id}/mode`}
                    className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-gray-400 hover:text-primary-700 hover:bg-primary-50"
                    aria-label="Enter Function Mode"
                    title="Function Mode"
                  >
                    <Zap className="h-4 w-4" />
                  </Link>
                  <IconButton label="Edit" onClick={() => onEdit(f)}>
                    <Edit2 className="h-4 w-4" />
                  </IconButton>
                  <IconButton label="Delete" tone="danger" onClick={() => del.request(f)}>
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </div>
              ),
            },
          ]}
          renderMobileCard={(f) => (
            <Card padding="sm" className="flex items-start gap-3 active:bg-gray-50">
              <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                <CalendarDays className="h-5 w-5 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{f.name}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <FunctionTypeBadge type={f.type} />
                  <span className="text-xs text-gray-500">{formatDate(f.date)}</span>
                </div>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="text-gray-600 inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-gray-400" />
                    {f.peopleCount || 0}
                  </span>
                  <span className="font-semibold text-received-700">
                    Received {formatCurrency(f.received || 0)}
                  </span>
                  {f.given ? (
                    <span className="font-semibold text-given-700">Given {formatCurrency(f.given)}</span>
                  ) : null}
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-300 shrink-0 mt-2" />
            </Card>
          )}
          footer={data?.pagination && <Pagination pagination={data.pagination} onPageChange={setPage} />}
        />
      )}

      <DeleteFunctionDialog state={del} />
    </div>
  );
};
