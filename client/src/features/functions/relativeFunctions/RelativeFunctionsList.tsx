import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock,
  Edit2,
  MapPin,
  Plus,
  Trash2,
} from 'lucide-react';
import { functionsApi } from '@/api/functions';
import { Card } from '@/components/ui/Card';
import { Button, IconButton } from '@/components/ui/Button';
import { SearchBar } from '@/components/ui/SearchBar';
import { FunctionTypeBadge } from '@/components/ui/Badge';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { cn, formatDateLong, formatTime, relativeDayLabel } from '@/lib/utils';
import { qk } from '@/lib/queryClient';
import type { FunctionEvent } from '@/types';
import { useDeleteFunction } from '../useDeleteFunction';
import { DeleteFunctionDialog } from '../DeleteFunctionDialog';

interface Props {
  onAdd: () => void;
  onEdit: (fn: FunctionEvent) => void;
}

const ReminderRow: React.FC<{
  fn: FunctionEvent;
  past?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ fn, past, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const d = new Date(fn.date);
  const label = relativeDayLabel(fn.date);
  const soon = !past && (label === 'Today' || label === 'Tomorrow');

  return (
    <Card
      padding="none"
      className={cn(
        'flex items-stretch overflow-hidden cursor-pointer hover:shadow-card-hover transition-shadow',
        past && 'opacity-75'
      )}
      onClick={() => navigate(`/functions/${fn._id}`)}
    >
      {/* Date block */}
      <div
        className={cn(
          'w-20 shrink-0 flex flex-col items-center justify-center py-3 border-r',
          soon ? 'bg-primary-600 text-white border-primary-700' : 'bg-gray-50 text-gray-700 border-gray-100'
        )}
        aria-hidden
      >
        <span className="text-2xl font-bold leading-none">{d.getDate()}</span>
        <span className="text-xs font-semibold uppercase mt-1">
          {d.toLocaleString('en-IN', { month: 'short' })}
        </span>
      </div>

      <div className="flex-1 min-w-0 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{fn.name}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <FunctionTypeBadge type={fn.type} />
              <span
                className={cn(
                  'text-xs font-semibold',
                  soon ? 'text-primary-700' : past ? 'text-gray-400' : 'text-gray-500'
                )}
              >
                {label}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <IconButton label="Edit" onClick={onEdit}>
              <Edit2 className="h-4 w-4" />
            </IconButton>
            <IconButton label="Delete" tone="danger" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </IconButton>
            <ChevronRight className="h-5 w-5 text-gray-300 ml-1 hidden sm:block" />
          </div>
        </div>

        <dl className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-sm">
          <div className="flex items-center gap-2 text-gray-700">
            <CalendarDays className="h-4 w-4 text-gray-400 shrink-0" />
            <dt className="sr-only">When</dt>
            <dd>{formatDateLong(fn.date)}</dd>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <Clock className="h-4 w-4 text-gray-400 shrink-0" />
            <dt className="sr-only">Time</dt>
            <dd>{fn.time ? formatTime(fn.time) : <span className="text-gray-400">Time not set</span>}</dd>
          </div>
          <div className="flex items-center gap-2 text-gray-700 min-w-0">
            <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
            <dt className="sr-only">Where</dt>
            <dd className="truncate">
              {fn.location || <span className="text-gray-400">Location not set</span>}
            </dd>
          </div>
        </dl>
      </div>
    </Card>
  );
};

export const RelativeFunctionsList: React.FC<Props> = ({ onAdd, onEdit }) => {
  const [search, setSearch] = useState('');
  const [showPast, setShowPast] = useState(false);
  const del = useDeleteFunction();

  const upcoming = useQuery({
    queryKey: [...qk.functions, 'RELATIVE', 'upcoming', { search }],
    queryFn: () => functionsApi.list({ category: 'RELATIVE', upcoming: 'true', search, limit: 100 }),
    placeholderData: (prev) => prev,
  });

  const past = useQuery({
    queryKey: [...qk.functions, 'RELATIVE', 'past', { search }],
    queryFn: () => functionsApi.list({ category: 'RELATIVE', upcoming: 'false', search, limit: 100 }),
    placeholderData: (prev) => prev,
  });

  const upcomingRows = upcoming.data?.data ?? [];
  const pastRows = past.data?.data ?? [];
  const pastTotal = past.data?.pagination?.total ?? 0;

  return (
    <div className="space-y-5">
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search relative functions…"
        className="max-w-md"
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Coming up {upcoming.data?.pagination && `(${upcoming.data.pagination.total})`}
        </h2>

        {upcoming.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : upcoming.isError ? (
          <ErrorState compact message="Could not load upcoming functions." onRetry={() => upcoming.refetch()} />
        ) : upcomingRows.length === 0 ? (
          <Card padding="none">
            <EmptyState
              compact
              icon={<CalendarDays className="h-8 w-8" />}
              title={search ? 'No upcoming functions match' : 'Nothing coming up'}
              description={
                search
                  ? 'Try a different search.'
                  : 'Add a relative’s wedding, housewarming or birthday so you never miss it.'
              }
              action={
                !search && (
                  <Button onClick={onAdd} icon={<Plus className="h-4 w-4" />}>
                    Add a relative function
                  </Button>
                )
              }
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {upcomingRows.map((fn) => (
              <ReminderRow key={fn._id} fn={fn} onEdit={() => onEdit(fn)} onDelete={() => del.request(fn)} />
            ))}
          </div>
        )}
      </section>

      {(pastTotal > 0 || past.isLoading) && (
        <section className="space-y-3">
          <button
            type="button"
            onClick={() => setShowPast((v) => !v)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-800 min-h-[40px]"
            aria-expanded={showPast}
          >
            <ChevronDown className={cn('h-4 w-4 transition-transform', !showPast && '-rotate-90')} />
            Past {pastTotal > 0 && `(${pastTotal})`}
          </button>

          {showPast &&
            (past.isLoading ? (
              <CardSkeleton />
            ) : past.isError ? (
              <ErrorState compact message="Could not load past functions." onRetry={() => past.refetch()} />
            ) : (
              <div className="space-y-3">
                {pastRows.map((fn) => (
                  <ReminderRow key={fn._id} fn={fn} past onEdit={() => onEdit(fn)} onDelete={() => del.request(fn)} />
                ))}
              </div>
            ))}
        </section>
      )}

      <DeleteFunctionDialog state={del} />
    </div>
  );
};
