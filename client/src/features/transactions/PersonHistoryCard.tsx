import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { transactionsApi } from '@/api/transactions';
import { cn, formatCurrency, formatDate, isPopulated } from '@/lib/utils';
import { qk } from '@/lib/queryClient';
import type { Person } from '@/types';

interface Props {
  person: Person;
  /** Dark variant for Function Mode. */
  dark?: boolean;
  limit?: number;
}

/** Inline "previous Moi" summary shown once a person is picked. */
export const PersonHistoryCard: React.FC<Props> = ({ person, dark, limit = 3 }) => {
  const { data, isLoading } = useQuery({
    queryKey: [...qk.transactions, 'history', person._id, limit],
    queryFn: () => transactionsApi.list({ personId: person._id, limit }).then((r) => r),
  });

  const rows = data?.data ?? [];
  const total = data?.pagination?.total ?? 0;
  const received = person.totalReceived ?? 0;
  const given = person.totalGiven ?? 0;

  const muted = dark ? 'text-gray-400' : 'text-gray-500';
  const strong = dark ? 'text-white' : 'text-gray-900';

  return (
    <div
      className={cn(
        'rounded-xl p-3.5 text-sm border',
        dark ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-100'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <p className={cn('text-xs font-semibold uppercase tracking-wide', muted)}>Previous Moi</p>
        {total > 0 && <p className={cn('text-xs', muted)}>{total} {total === 1 ? 'entry' : 'entries'}</p>}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <div className={cn('h-3 w-2/3 rounded animate-pulse', dark ? 'bg-gray-800' : 'bg-gray-200')} />
          <div className={cn('h-3 w-1/2 rounded animate-pulse', dark ? 'bg-gray-800' : 'bg-gray-200')} />
        </div>
      ) : rows.length === 0 ? (
        <p className={cn('text-sm', muted)}>No Moi recorded yet. This will be the first entry.</p>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((t) => {
            const fn = isPopulated(t.functionId) ? t.functionId : null;
            return (
              <li key={t._id} className="flex items-center justify-between gap-3">
                <span className={cn('truncate', strong)}>
                  {fn?.name || 'Function'}
                  <span className={cn('ml-1.5 text-xs', muted)}>{formatDate(t.transactionDate)}</span>
                </span>
                <span
                  className={cn(
                    'font-semibold shrink-0 tabular-nums',
                    t.type === 'RECEIVED'
                      ? dark ? 'text-received-400' : 'text-received-700'
                      : dark ? 'text-given-400' : 'text-given-700'
                  )}
                >
                  {t.type === 'RECEIVED' ? 'Received' : 'Given'} {formatCurrency(t.amount)}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <div className={cn('flex items-center justify-between pt-2 mt-2 border-t', dark ? 'border-gray-800' : 'border-gray-200')}>
        <span className={cn('text-xs font-medium', muted)}>All time</span>
        <div className="flex gap-3 text-xs font-bold tabular-nums">
          <span className={dark ? 'text-received-400' : 'text-received-700'}>Received {formatCurrency(received)}</span>
          <span className={dark ? 'text-given-400' : 'text-given-700'}>Given {formatCurrency(given)}</span>
        </div>
      </div>
    </div>
  );
};
