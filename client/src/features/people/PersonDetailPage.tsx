import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit2, Plus, Phone, MapPin, ArrowDown, ArrowUp, Calendar } from 'lucide-react';
import { peopleApi } from '@/api/people';
import { Card, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TransactionBadge, FunctionTypeBadge } from '@/components/ui/Badge';
import { StatCardSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState, EmptyState } from '@/components/ui/EmptyState';
import { AddEditPersonModal } from './AddEditPersonModal';
import { AddMoiModal } from '@/features/transactions/AddMoiModal';
import { formatCurrency, formatDate, getPersonName } from '@/lib/utils';
import type { Transaction, FunctionEvent } from '@/types';

export const PersonDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddMoi, setShowAddMoi] = useState(false);

  const { data: person, isLoading, isError, refetch } = useQuery({
    queryKey: ['person', id],
    queryFn: () => peopleApi.getById(id!).then((r) => r.data),
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

  if (isError || !person) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to People
      </button>

      {/* Person header */}
      <Card>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center">
              <span className="text-xl font-bold text-primary-700">
                {(person.husbandName || person.wifeName || '?').charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{getPersonName(person)}</h1>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {person.area}
                </span>
                {person.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    {person.phone}
                  </span>
                )}
              </div>
              {person.notes && (
                <p className="text-sm text-gray-500 mt-1">{person.notes}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<Edit2 className="h-4 w-4" />}
              onClick={() => setShowEditModal(true)}
            >
              Edit
            </Button>
            <Button
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setShowAddMoi(true)}
              id="person-add-moi-btn"
            >
              Add Moi
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Received"
          value={formatCurrency(person.totalReceived || 0)}
          icon={<ArrowDown className="h-5 w-5 text-received-600" />}
          iconBg="bg-received-50"
        />
        <StatCard
          label="Total Given"
          value={formatCurrency(person.totalGiven || 0)}
          icon={<ArrowUp className="h-5 w-5 text-given-600" />}
          iconBg="bg-given-50"
        />
        <StatCard
          label="Functions"
          value={person.totalFunctions || 0}
          icon={<Calendar className="h-5 w-5 text-primary-600" />}
          iconBg="bg-primary-50"
        />
        <StatCard
          label="Last Transaction"
          value={person.lastTransaction ? formatDate(person.lastTransaction) : '—'}
          icon={<Calendar className="h-5 w-5 text-gray-400" />}
          iconBg="bg-gray-50"
        />
      </div>

      {/* Transaction history */}
      <Card padding="none">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Transaction History</h2>
          <span className="text-sm text-gray-500">{person.transactions?.length || 0} transactions</span>
        </div>
        {!person.transactions || person.transactions.length === 0 ? (
          <EmptyState
            title="No transactions yet"
            description="Add a Moi transaction for this person"
            action={
              <Button onClick={() => setShowAddMoi(true)} icon={<Plus className="h-4 w-4" />} size="sm">
                Add Moi
              </Button>
            }
          />
        ) : (
          <div className="divide-y divide-gray-50">
            {person.transactions.map((t: Transaction) => {
              const fn = t.functionId as FunctionEvent;
              return (
                <div key={t._id} className="px-5 py-3.5 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-900 truncate">{fn?.name || 'Unknown'}</p>
                      {fn?.type && <FunctionTypeBadge type={fn.type} />}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{formatDate(t.transactionDate)}</p>
                    {t.notes && <p className="text-xs text-gray-400 mt-0.5 italic">{t.notes}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-sm font-bold ${
                        t.type === 'RECEIVED' ? 'text-received-600' : 'text-given-600'
                      }`}
                    >
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

      <AddEditPersonModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        person={person}
      />
      <AddMoiModal
        isOpen={showAddMoi}
        onClose={() => setShowAddMoi(false)}
        prefillPersonId={id}
      />
    </div>
  );
};
