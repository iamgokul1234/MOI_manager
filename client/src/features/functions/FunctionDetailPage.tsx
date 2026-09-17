import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Clock,
  Edit2,
  ListChecks,
  MapPin,
  Plus,
  StickyNote,
  Trash2,
  Users,
  Zap,
} from 'lucide-react';
import { functionsApi } from '@/api/functions';
import { Card, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { CategoryBadge, FunctionTypeBadge } from '@/components/ui/Badge';
import { StatCardSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/EmptyState';
import { cn, formatCurrency, formatDate, formatDateLong, formatTime, isPastDate, relativeDayLabel } from '@/lib/utils';
import { qk } from '@/lib/queryClient';
import { AddEditFunctionModal } from './AddEditFunctionModal';
import { FunctionPeopleList } from './functionPeopleList/FunctionPeopleList';
import { AddMoiModal } from '@/features/transactions/AddMoiModal';
import { useDeleteFunction } from './useDeleteFunction';
import { DeleteFunctionDialog } from './DeleteFunctionDialog';

export const FunctionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showEdit, setShowEdit] = useState(false);
  const [showAddMoi, setShowAddMoi] = useState(false);
  const del = useDeleteFunction(() => navigate('/functions', { replace: true }));

  const { data: fn, isLoading, isError, refetch } = useQuery({
    queryKey: qk.fn(id!),
    queryFn: () => functionsApi.getById(id!).then((r) => r.data),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-6 w-32" />
        <div className="skeleton h-28 w-full rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !fn) {
    return <ErrorState message="Could not load this function." onRetry={() => refetch()} />;
  }

  const isOur = fn.category === 'OUR';
  const backTo = isOur ? '/functions?tab=our' : '/functions?tab=relative';

  return (
    <div className="space-y-6">
      <PageHeader
        backTo={backTo}
        backLabel={isOur ? 'Our Functions' : 'Relative Functions'}
        title={fn.name}
        subtitle={
          <span className="inline-flex items-center gap-2 flex-wrap mt-1">
            <CategoryBadge category={fn.category} />
            <FunctionTypeBadge type={fn.type} />
          </span>
        }
        actions={
          <>
            <Button variant="outline" icon={<Edit2 className="h-4 w-4" />} onClick={() => setShowEdit(true)}>
              Edit
            </Button>
            <Button variant="outline" icon={<Trash2 className="h-4 w-4" />} onClick={() => del.request(fn)}>
              Delete
            </Button>
            {isOur ? (
              <>
                <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowAddMoi(true)}>
                  Add Person
                </Button>
                <Link to={`/functions/${fn._id}/mode`}>
                  <Button variant="outline" icon={<Zap className="h-4 w-4 text-amber-500" />} id="enter-function-mode-btn">
                    Function Mode
                  </Button>
                </Link>
              </>
            ) : (
              <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowAddMoi(true)}>
                Add Moi
              </Button>
            )}
          </>
        }
      />

      {/* Event details */}
      <Card className={cn(!isOur && 'border-primary-100 bg-gradient-to-br from-white to-primary-50/40')}>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-primary-50 text-primary-600 shrink-0">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">When</p>
              <p className="font-semibold text-gray-900">{formatDateLong(fn.date)}</p>
              {!isOur && (
                <p className={cn('text-sm', isPastDate(fn.date) ? 'text-gray-400' : 'text-primary-700 font-medium')}>
                  {relativeDayLabel(fn.date)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-primary-50 text-primary-600 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Time</p>
              <p className="font-semibold text-gray-900">
                {fn.time ? formatTime(fn.time) : <span className="text-gray-400 font-normal">Not set</span>}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-primary-50 text-primary-600 shrink-0">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Where</p>
              <p className="font-semibold text-gray-900 break-words">
                {fn.location || <span className="text-gray-400 font-normal">Not set</span>}
              </p>
            </div>
          </div>
        </div>
        {fn.notes && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-start gap-2 text-sm text-gray-600">
            <StickyNote className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
            <p className="whitespace-pre-line">{fn.notes}</p>
          </div>
        )}
      </Card>

      {isOur ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total People"
              value={fn.totalPeople || 0}
              icon={<Users className="h-5 w-5 text-primary-600" />}
              iconBg="bg-primary-50"
            />
            <StatCard
              label="Total Received"
              value={formatCurrency(fn.totalReceived || 0)}
              icon={<ArrowDownLeft className="h-5 w-5 text-received-600" />}
              iconBg="bg-received-50"
            />
            <StatCard
              label="Total Given"
              value={formatCurrency(fn.totalGiven || 0)}
              icon={<ArrowUpRight className="h-5 w-5 text-given-600" />}
              iconBg="bg-given-50"
            />
            <StatCard
              label="Entries"
              value={fn.transactionCount || 0}
              icon={<ListChecks className="h-5 w-5 text-gray-500" />}
              iconBg="bg-gray-100"
            />
          </div>

          <FunctionPeopleList fn={fn} onAddPerson={() => setShowAddMoi(true)} />

          {/* Sticky mobile CTA so the core workflow is one thumb away */}
          <div className="md:hidden fixed bottom-20 inset-x-4 z-20">
            <Link to={`/functions/${fn._id}/mode`} className="block">
              <Button fullWidth size="lg" icon={<Zap className="h-5 w-5" />} className="shadow-lg">
                Enter Function Mode
              </Button>
            </Link>
          </div>
          <div className="md:hidden h-14" aria-hidden />
        </>
      ) : (
        <>
          {(fn.totalReceived || fn.totalGiven) ? (
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                label="Given here"
                value={formatCurrency(fn.totalGiven || 0)}
                icon={<ArrowUpRight className="h-5 w-5 text-given-600" />}
                iconBg="bg-given-50"
              />
              <StatCard
                label="Received here"
                value={formatCurrency(fn.totalReceived || 0)}
                icon={<ArrowDownLeft className="h-5 w-5 text-received-600" />}
                iconBg="bg-received-50"
              />
            </div>
          ) : null}
          <FunctionPeopleList fn={fn} compact onAddMoi={() => setShowAddMoi(true)} />
          <p className="text-xs text-gray-400 text-center">
            Last updated {formatDate(fn.updatedAt)}
          </p>
        </>
      )}

      <AddEditFunctionModal isOpen={showEdit} onClose={() => setShowEdit(false)} fn={fn} />
      <AddMoiModal
        isOpen={showAddMoi}
        onClose={() => setShowAddMoi(false)}
        prefillFunction={fn}
        defaultType="GIVEN"
      />
      <DeleteFunctionDialog state={del} />
    </div>
  );
};
