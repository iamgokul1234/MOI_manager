import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ className, lines = 3 }) => (
  <div className={cn('space-y-3', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className="skeleton h-4 w-full" style={{ width: `${100 - i * 10}%` }} />
    ))}
  </div>
);

export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('bg-white rounded-xl border border-gray-100 p-5 space-y-3', className)}>
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

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 5,
}) => (
  <div className="space-y-2">
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="skeleton h-4 w-full" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, ri) => (
      <div
        key={ri}
        className="grid gap-4 border-t border-gray-50 pt-2"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {Array.from({ length: cols }).map((_, ci) => (
          <div key={ci} className="skeleton h-4 w-full" />
        ))}
      </div>
    ))}
  </div>
);

export const StatCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4">
    <div className="skeleton h-12 w-12 rounded-xl shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="skeleton h-4 w-1/2" />
      <div className="skeleton h-7 w-2/3" />
    </div>
  </div>
);
