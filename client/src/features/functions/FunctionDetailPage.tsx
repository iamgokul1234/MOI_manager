import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  Edit2,
  MapPin,
  Users,
  ArrowDown,
  ArrowUp,
  Zap,
  Plus,
} from 'lucide-react';
import { functionsApi } from '@/api/functions';
import { Card, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TransactionBadge, FunctionTypeBadge } from '@/components/ui/Badge';
import { StatCardSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState, EmptyState } from '@/components/ui/EmptyState';
import { AddEditFunctionModal } from './AddEditFunctionModal';
import { AddMoiModal } from '@/features/transactions/AddMoiModal';
import { formatCurrency, formatDate, getPersonName } from '@/lib/utils';
import type { Transaction, Person } from '@/types';

export const FunctionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddMoi, setShowAddMoi] = useState(false);

  const { data: fn, isLoading, isError, refetch } = useQuery({
    queryKey: ['function', id],
    queryFn: () => functionsApi.getById(id!).then((r) => r.data),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (isError || !fn) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Functions
      </button>

      {/* Function header */}
      <Card>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center">
              <Calendar className="h-7 w-7 text-primary-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{fn.name}</h1>
                <FunctionTypeBadge type={fn.type} />
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(fn.date)}
                </span>
                {fn.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {fn.location}
                  </span>
                )}
              </div>
              {fn.notes && <p className="text-sm text-gray-500 mt-1">{fn.notes}</p>}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" icon={<Edit2 className="h-4 w-4" />} onClick={() => setShowEditModal(true)}>
              Edit
            </Button>
            <Button variant="outline" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setShowAddMoi(true)}>
              Add Moi
            </Button>
            <Link to={`/functions/${id}/mode`}>
              <Button size="sm" icon={<Zap className="h-4 w-4" />} className="bg-amber-500 hover:bg-amber-600">
                Function Mode
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Received"
          value={formatCurrency(fn.totalReceived || 0)}
          icon={<ArrowDown className="h-5 w-5 text-received-600" />}
          iconBg="bg-received-50"
        />
        <StatCard
          label="Total Given"
          value={formatCurrency(fn.totalGiven || 0)}
          icon={<ArrowUp className="h-5 w-5 text-given-600" />}
          iconBg="bg-given-50"
        />
        <StatCard
          label="People"
          value={fn.totalPeople || 0}
          icon={<Users className="h-5 w-5 text-primary-600" />}
          iconBg="bg-primary-50"
        />
        <StatCard
          label="Transactions"
          value={fn.transactionCount || 0}
          icon={<ArrowDown className="h-5 w-5 text-gray-400" />}
          iconBg="bg-gray-50"
        />
      </div>

      {/* Transactions */}
      <Card padding="none">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Transactions</h2>
          <span className="text-sm text-gray-500">{fn.transactions?.length || 0} entries</span>
        </div>
        {!fn.transactions || fn.transactions.length === 0 ? (
          <EmptyState
            title="No transactions yet"
            description="Use Function Mode for quick entry during the event"
            action={
              <Link to={`/functions/${id}/mode`}>
                <Button icon={<Zap className="h-4 w-4" />} className="bg-amber-500 hover:bg-amber-600">
                  Enter Function Mode
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="divide-y divide-gray-50">
            {fn.transactions.map((t: Transaction) => {
              const person = t.personId as Person;
              return (
                <div key={t._id} className="px-5 py-3.5 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{getPersonName(person)}</p>
                    <p className="text-xs text-gray-500">
                      {person?.area} · {formatDate(t.transactionDate)}
                    </p>
                    {t.notes && <p className="text-xs text-gray-400 italic mt-0.5">{t.notes}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${t.type === 'RECEIVED' ? 'text-received-600' : 'text-given-600'}`}>
                      {t.type === 'RECEIVED' ? '+' : '-'}{formatCurrency(t.amount)}
                    </p>
                    <TransactionBadge type={t.type} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <AddEditFunctionModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} fn={fn} />
      <AddMoiModal isOpen={showAddMoi} onClose={() => setShowAddMoi(false)} prefillFunctionId={id} />
    </div>
  );
};
