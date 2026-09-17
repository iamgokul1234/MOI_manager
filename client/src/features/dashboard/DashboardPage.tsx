import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users,
  Calendar,
  ArrowDown,
  ArrowUp,
  TrendingUp,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { dashboardApi } from '@/api/reports';
import { Card, StatCard } from '@/components/ui/Card';
import { StatCardSkeleton } from '@/components/ui/LoadingSkeleton';
import { TransactionBadge } from '@/components/ui/Badge';
import { ErrorState } from '@/components/ui/EmptyState';
import { formatCurrency, formatDate, getPersonName } from '@/lib/utils';
import type { Transaction, FunctionEvent, Person } from '@/types';

export const DashboardPage: React.FC = () => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.get().then((r) => r.data),
  });

  if (isError) {
    return <ErrorState message="Failed to load dashboard" onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Welcome back — here's your Moi overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              label="Total Received"
              value={formatCurrency(data?.totalReceived || 0)}
              icon={<ArrowDown className="h-5 w-5 text-received-600" />}
              iconBg="bg-received-50"
            />
            <StatCard
              label="Total Given"
              value={formatCurrency(data?.totalGiven || 0)}
              icon={<ArrowUp className="h-5 w-5 text-given-600" />}
              iconBg="bg-given-50"
            />
            <StatCard
              label="Total People"
              value={data?.totalPeople || 0}
              icon={<Users className="h-5 w-5 text-primary-600" />}
              iconBg="bg-primary-50"
            />
            <StatCard
              label="Total Functions"
              value={data?.totalFunctions || 0}
              icon={<Calendar className="h-5 w-5 text-primary-600" />}
              iconBg="bg-primary-50"
            />
          </>
        )}
      </div>

      {/* Net difference */}
      {!isLoading && data && (
        <Card className="flex items-center gap-4 bg-gradient-to-r from-primary-600 to-indigo-700 text-white border-0">
          <div className="p-3 bg-white/20 rounded-xl">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-white/80">Net Difference</p>
            <p className="text-2xl font-bold">
              {formatCurrency(data.netDifference)}
            </p>
          </div>
          <div className="ml-auto text-sm text-white/70">
            {data.netDifference >= 0 ? 'You have received more' : 'You have given more'}
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card padding="none">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900 text-sm">Recent Transactions</h2>
            <Link
              to="/transactions"
              className="text-xs text-primary-600 font-medium flex items-center gap-0.5 hover:underline"
            >
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-3">
                  <div className="skeleton h-4 w-24" />
                  <div className="skeleton h-4 w-16 ml-auto" />
                </div>
              ))
            ) : data?.recentTransactions.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">
                No transactions yet
              </div>
            ) : (
              data?.recentTransactions.map((t: Transaction) => {
                const person = t.personId as Person;
                const fn = t.functionId as FunctionEvent;
                return (
                  <div key={t._id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {getPersonName(person)}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{fn?.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`text-sm font-semibold ${
                          t.type === 'RECEIVED' ? 'text-received-600' : 'text-given-600'
                        }`}
                      >
                        {t.type === 'RECEIVED' ? '+' : '-'}{formatCurrency(t.amount)}
                      </p>
                      <TransactionBadge type={t.type} showIcon={false} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <div className="space-y-4">
          {/* Upcoming Functions */}
          <Card padding="none">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <h2 className="font-semibold text-gray-900 text-sm">Upcoming Functions</h2>
              <Link
                to="/functions"
                className="text-xs text-primary-600 font-medium flex items-center gap-0.5 hover:underline"
              >
                View all <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="px-5 py-3">
                    <div className="skeleton h-4 w-32 mb-1" />
                    <div className="skeleton h-3 w-20" />
                  </div>
                ))
              ) : data?.upcomingFunctions.length === 0 ? (
                <div className="px-5 py-6 text-center text-sm text-gray-400">
                  No upcoming functions
                </div>
              ) : (
                data?.upcomingFunctions.map((f: FunctionEvent) => (
                  <Link
                    key={f._id}
                    to={`/functions/${f._id}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center shrink-0">
                      <Calendar className="h-4 w-4 text-primary-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{f.name}</p>
                      <p className="text-xs text-gray-500">{formatDate(f.date)}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Card>

          {/* Recently Added People */}
          <Card padding="none">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <h2 className="font-semibold text-gray-900 text-sm">Recently Added</h2>
              <Link
                to="/people"
                className="text-xs text-primary-600 font-medium flex items-center gap-0.5 hover:underline"
              >
                View all <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="px-5 py-3">
                    <div className="skeleton h-4 w-32 mb-1" />
                    <div className="skeleton h-3 w-20" />
                  </div>
                ))
              ) : data?.recentPeople.length === 0 ? (
                <div className="px-5 py-6 text-center">
                  <p className="text-sm text-gray-400 mb-2">No people added yet</p>
                  <Link to="/people" className="text-xs text-primary-600 font-medium">
                    Add your first family →
                  </Link>
                </div>
              ) : (
                data?.recentPeople.map((p: Person) => (
                  <Link
                    key={p._id}
                    to={`/people/${p._id}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-gray-600">
                        {(p.husbandName || p.wifeName || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {getPersonName(p)}
                      </p>
                      <p className="text-xs text-gray-500">{p.area}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Quick actions */}
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-gray-100">
        <h2 className="font-semibold text-gray-900 mb-3 text-sm">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/people"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-primary-300 hover:text-primary-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Person
          </Link>
          <Link
            to="/functions"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-primary-300 hover:text-primary-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Function
          </Link>
          <Link
            to="/reports"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-primary-300 hover:text-primary-700 transition-colors shadow-sm"
          >
            <TrendingUp className="h-4 w-4" />
            View Reports
          </Link>
        </div>
      </Card>
    </div>
  );
};
