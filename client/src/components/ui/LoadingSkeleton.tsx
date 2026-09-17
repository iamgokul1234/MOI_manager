import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ className, lines = 3 }) => (
  <div className={cn('space-y-3', className)} aria-busy aria-label="Loading">
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className="skeleton h-4" style={{ width: `${100 - i * 12}%` }} />
    ))}
  </div>
);

export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('bg-white rounded-xl border border-gray-200 p-4 space-y-3', className)} aria-busy>
    <div className="flex items-center gap-3">
      <div className="skeleton h-10 w-10 rounded-xl" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-1/2" />
      </div>
    </div>
    <div className="skeleton h-3 w-full" />
    <div className="skeleton h-3 w-2/3" />
  </div>
);

/** Table on desktop, stacked cards on mobile — mirrors DataTable's layout. */
export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 5 }) => (
  <>
    <div className="hidden md:block bg-white rounded-xl border border-gray-200 p-4 space-y-3" aria-busy>
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="skeleton h-3 w-2/3" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, ri) => (
        <div
          key={ri}
          className="grid gap-4 border-t border-gray-100 pt-3"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {Array.from({ length: cols }).map((_, ci) => (
            <div key={ci} className="skeleton h-4 w-full" />
          ))}
        </div>
      ))}
    </div>
    <div className="md:hidden space-y-3">
      {Array.from({ length: Math.min(rows, 4) }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  </>
);

export const ListSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="divide-y divide-gray-100" aria-busy>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="px-5 py-3.5 flex items-center gap-3">
        <div className="skeleton h-9 w-9 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-1/2" />
          <div className="skeleton h-3 w-1/3" />
        </div>
        <div className="skeleton h-4 w-16" />
      </div>
    ))}
  </div>
);

export const StatCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4" aria-busy>
    <div className="skeleton h-12 w-12 rounded-xl shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="skeleton h-4 w-1/2" />
      <div className="skeleton h-7 w-2/3" />
    </div>
  </div>
);
