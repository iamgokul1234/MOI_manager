import React, { useState } from 'react';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface FilterBarProps {
  /** Number of filters currently active — shown as a count on the toggle. */
  activeCount: number;
  onClear: () => void;
  /** Always-visible controls (search box, primary select). */
  primary?: React.ReactNode;
  /** Controls revealed by the "Filters" toggle. Wrapped in a responsive grid. */
  children?: React.ReactNode;
  className?: string;
  defaultOpen?: boolean;
}

/**
 * Collapsible filter panel. Primary controls (search) stay visible; the rest
 * fold away behind a "Filters" button so the phone layout stays short.
 */
export const FilterBar: React.FC<FilterBarProps> = ({
  activeCount,
  onClear,
  primary,
  children,
  className,
  defaultOpen = false,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex gap-2 flex-wrap items-center">
        {primary && <div className="flex-1 min-w-[200px]">{primary}</div>}
        {children && (
          <Button
            variant={activeCount > 0 ? 'primary' : 'outline'}
            size="md"
            icon={<SlidersHorizontal className="h-4 w-4" />}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="filter-panel"
          >
            Filters
            {activeCount > 0 && (
              <span className="ml-0.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-white/25 text-xs font-semibold">
                {activeCount}
              </span>
            )}
            <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
          </Button>
        )}
        {activeCount > 0 && (
          <Button variant="ghost" size="md" icon={<X className="h-4 w-4" />} onClick={onClear}>
            Clear
          </Button>
        )}
      </div>

      {children && open && (
        <div
          id="filter-panel"
          className="bg-white border border-gray-200 rounded-xl p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in"
        >
          {children}
        </div>
      )}
    </div>
  );
};

/** Small label+control wrapper used inside FilterBar. */
export const FilterField: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({
  label,
  children,
  className,
}) => (
  <label className={cn('block', className)}>
    <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
      {label}
    </span>
    {children}
  </label>
);
