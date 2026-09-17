import React from 'react';
import { cn } from '@/lib/utils';

export interface TabItem<K extends string> {
  key: K;
  label: React.ReactNode;
  icon?: React.ReactNode;
  count?: number;
}

interface TabsProps<K extends string> {
  tabs: TabItem<K>[];
  value: K;
  onChange: (key: K) => void;
  className?: string;
}

/** Underlined top-level tabs (e.g. Our Functions / Relative Functions). */
export function Tabs<K extends string>({ tabs, value, onChange, className }: TabsProps<K>) {
  return (
    <div role="tablist" className={cn('flex border-b border-gray-200 -mb-px', className)}>
      {tabs.map((t) => {
        const active = t.key === value;
        return (
          <button
            key={t.key}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(t.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors min-h-[48px]',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-t-lg',
              active
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
            )}
          >
            {t.icon}
            {t.label}
            {typeof t.count === 'number' && (
              <span
                className={cn(
                  'inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full text-xs font-semibold',
                  active ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

interface SegmentedProps<K extends string> {
  options: { value: K; label: React.ReactNode; icon?: React.ReactNode; tone?: 'received' | 'given' | 'primary' }[];
  value: K;
  onChange: (value: K) => void;
  className?: string;
  size?: 'md' | 'lg';
  'aria-label'?: string;
}

/** Pill-style segmented control (Received / Given, Our / Relative). */
export function SegmentedControl<K extends string>({
  options,
  value,
  onChange,
  className,
  size = 'md',
  ...rest
}: SegmentedProps<K>) {
  const toneActive: Record<string, string> = {
    received: 'bg-received-600 text-white shadow-sm',
    given: 'bg-given-600 text-white shadow-sm',
    primary: 'bg-white text-primary-700 shadow-sm',
  };
  return (
    <div
      role="radiogroup"
      aria-label={rest['aria-label']}
      className={cn(
        'grid gap-1 p-1 bg-gray-100 rounded-xl',
        className
      )}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'flex items-center justify-center gap-2 rounded-lg font-semibold transition-all',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
              size === 'lg' ? 'py-3.5 text-base min-h-[52px]' : 'py-2.5 text-sm min-h-[42px]',
              active
                ? toneActive[o.tone || 'primary']
                : 'text-gray-500 hover:text-gray-800'
            )}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
