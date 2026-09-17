import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, ArrowDown, ArrowUp, Users, Calendar } from 'lucide-react';
import { reportsApi } from '@/api/reports';
import { Card, StatCard } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { StatCardSkeleton, TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/lib/utils';

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg text-sm">
        <p className="font-semibold text-gray-900 mb-1">{label}</p>
        {payload.map((p) => (
          <div key={p.name} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-gray-600">{p.name}:</span>
            <span className="font-semibold">{formatCurrency(p.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const ReportsPage: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState('all');
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['reports-summary'],
    queryFn: () => reportsApi.summary().then((r) => r.data),
  });

  const { data: functionReport, isLoading: fnLoading, isError: fnError, refetch: fnRefetch } = useQuery({
    queryKey: ['reports-functions'],
    queryFn: () => reportsApi.functions().then((r) => r.data),
  });

  const { data: areaReport, isLoading: areaLoading } = useQuery({
    queryKey: ['reports-areas'],
    queryFn: () => reportsApi.areas().then((r) => r.data),
  });

  const { data: yearlyReport, isLoading: yearlyLoading } = useQuery({
    queryKey: ['reports-yearly', selectedYear],
    queryFn: () => reportsApi.yearly(selectedYear).then((r) => r.data),
  });

  // Chart data
  const chartData = yearlyReport?.map((y) => ({
    year: y.year.toString(),
    Received: y.received,
    Given: y.given,
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your Moi overview and breakdowns</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {summaryLoading ? (
          Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              label="Total Received"
              value={formatCurrency(summary?.totalReceived || 0)}
              icon={<ArrowDown className="h-5 w-5 text-received-600" />}
              iconBg="bg-received-50"
            />
            <StatCard
              label="Total Given"
              value={formatCurrency(summary?.totalGiven || 0)}
              icon={<ArrowUp className="h-5 w-5 text-given-600" />}
              iconBg="bg-given-50"
            />
            <StatCard
              label="Net Difference"
              value={formatCurrency(summary?.netDifference || 0)}
              icon={<TrendingUp className="h-5 w-5 text-primary-600" />}
              iconBg="bg-primary-50"
              className={summary?.netDifference && summary.netDifference < 0 ? 'border-given-200' : ''}
            />
            <StatCard
              label="People"
              value={summary?.totalPeople || 0}
              icon={<Users className="h-5 w-5 text-primary-600" />}
              iconBg="bg-primary-50"
            />
            <StatCard
              label="Functions"
              value={summary?.totalFunctions || 0}
              icon={<Calendar className="h-5 w-5 text-primary-600" />}
              iconBg="bg-primary-50"
            />
          </>
        )}
      </div>

      {/* Yearly chart */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Yearly Overview</h2>
          <Select
            options={[
              { value: 'all', label: 'All Years' },
              ...years.map((y) => ({ value: y.toString(), label: y.toString() })),
            ]}
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-32"
          />
        </div>
        {yearlyLoading ? (
          <div className="h-48 skeleton rounded-xl" />
        ) : chartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
            No data for selected period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Received" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Given" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Function-wise table */}
        <Card padding="none">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">By Function</h2>
          </div>
          {fnLoading ? (
            <div className="p-5"><TableSkeleton rows={4} cols={4} /></div>
          ) : fnError ? (
            <ErrorState onRetry={() => fnRefetch()} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500">Function</th>
                    <th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-500">People</th>
                    <th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-500">Received</th>
                    <th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-500">Given</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {functionReport?.map((f) => (
                    <tr key={f._id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900 truncate max-w-[140px]">{f.name}</p>
                        <p className="text-xs text-gray-400">{f.type}</p>
                      </td>
                      <td className="px-5 py-3 text-right text-gray-600">{f.peopleCount}</td>
                      <td className="px-5 py-3 text-right text-received-700 font-semibold">
                        {formatCurrency(f.received)}
                      </td>
                      <td className="px-5 py-3 text-right text-given-700 font-semibold">
                        {formatCurrency(f.given)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Area-wise table */}
        <Card padding="none">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">By Area</h2>
          </div>
          {areaLoading ? (
            <div className="p-5"><TableSkeleton rows={4} cols={4} /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500">Area</th>
                    <th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-500">People</th>
                    <th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-500">Received</th>
                    <th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-500">Given</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {areaReport?.map((a) => (
                    <tr key={a.area} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 font-medium text-gray-900">{a.area}</td>
                      <td className="px-5 py-3 text-right text-gray-600">{a.peopleCount}</td>
                      <td className="px-5 py-3 text-right text-received-700 font-semibold">
                        {formatCurrency(a.received)}
                      </td>
                      <td className="px-5 py-3 text-right text-given-700 font-semibold">
                        {formatCurrency(a.given)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Yearly breakdown table */}
      <Card padding="none">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Year-wise Breakdown</h2>
        </div>
        {yearlyLoading ? (
          <div className="p-5"><TableSkeleton rows={3} cols={4} /></div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500">Year</th>
                <th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-500">Transactions</th>
                <th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-500">Received</th>
                <th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-500">Given</th>
                <th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-500">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {yearlyReport?.map((y) => (
                <tr key={y.year} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3 font-semibold text-gray-900">{y.year}</td>
                  <td className="px-5 py-3 text-right text-gray-600">{y.transactionCount}</td>
                  <td className="px-5 py-3 text-right text-received-700 font-semibold">
                    {formatCurrency(y.received)}
                  </td>
                  <td className="px-5 py-3 text-right text-given-700 font-semibold">
                    {formatCurrency(y.given)}
                  </td>
                  <td className={`px-5 py-3 text-right font-bold ${y.received - y.given >= 0 ? 'text-received-700' : 'text-given-700'}`}>
                    {formatCurrency(y.received - y.given)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};
