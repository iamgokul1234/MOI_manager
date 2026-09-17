import React, { useEffect, useId, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Loader2, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

export interface TypeaheadProps<T> {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  placeholder?: string;
  value: T | null;
  onChange: (item: T | null) => void;
  /** Runs (debounced) whenever the query changes. Empty query = "show suggestions". */
  search: (query: string) => Promise<T[]>;
  /** Stable cache namespace for TanStack Query. */
  queryKey: string;
  getKey: (item: T) => string;
  getLabel: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
  emptyText?: string;
  /** Rendered at the bottom of the dropdown (e.g. "Create new…"). Receives the current query. */
  footer?: (query: string, close: () => void) => React.ReactNode;
  autoFocus?: boolean;
  size?: 'md' | 'lg';
  id?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Searchable single-select. Keyboard: ↑/↓ to move, Enter to pick, Esc to close.
 * The selected item is shown as a chip inside the field with a clear button.
 */
export function Typeahead<T>({
  label,
  required,
  error,
  hint,
  placeholder = 'Search…',
  value,
  onChange,
  search,
  queryKey,
  getKey,
  getLabel,
  renderItem,
  emptyText = 'No matches',
  footer,
  autoFocus,
  size = 'md',
  id,
  disabled,
  className,
}: TypeaheadProps<T>) {
  const autoId = useId();
  const inputId = id || autoId;
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const debounced = useDebounce(query, 250);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: items = [], isFetching } = useQuery({
    queryKey: ['typeahead', queryKey, debounced],
    queryFn: () => search(debounced),
    enabled: open && !value,
    staleTime: 15_000,
  });

  useEffect(() => setHighlight(0), [items]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const pick = (item: T) => {
    onChange(item);
    setQuery('');
    setOpen(false);
  };

  const clear = () => {
    onChange(null);
    setQuery('');
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      if (items[highlight]) {
        e.preventDefault();
        pick(items[highlight]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const fieldClasses = cn(
    'w-full rounded-xl border bg-white text-gray-900 shadow-sm transition-colors',
    'focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20',
    error ? 'border-red-400' : 'border-gray-300',
    disabled && 'bg-gray-50 cursor-not-allowed',
    size === 'lg' ? 'min-h-[56px]' : 'min-h-[44px]'
  );

  return (
    <div className={cn('w-full', className)} ref={rootRef}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1" aria-hidden>*</span>}
        </label>
      )}

      <div className="relative">
        {value ? (
          <div className={cn(fieldClasses, 'flex items-center gap-2 pl-3.5 pr-2 py-2')}>
            <div className="flex-1 min-w-0">{renderItem(value)}</div>
            {!disabled && (
              <button
                type="button"
                onClick={clear}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                aria-label={`Clear ${label || 'selection'}`}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <div className={cn(fieldClasses, 'flex items-center')}>
            <Search
              className={cn('text-gray-400 shrink-0 ml-3.5', size === 'lg' ? 'h-5 w-5' : 'h-4 w-4')}
              aria-hidden
            />
            <input
              id={inputId}
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded={open}
              aria-controls={`${inputId}-listbox`}
              aria-autocomplete="list"
              autoComplete="off"
              value={query}
              disabled={disabled}
              autoFocus={autoFocus}
              placeholder={placeholder}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={onKeyDown}
              className={cn(
                'flex-1 min-w-0 bg-transparent px-3 py-2.5 focus:outline-none placeholder-gray-400',
                size === 'lg' ? 'text-lg' : 'text-base sm:text-sm'
              )}
            />
            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400 mr-3.5" aria-hidden />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400 mr-3.5" aria-hidden />
            )}
          </div>
        )}

        {open && !value && (
          <div
            id={`${inputId}-listbox`}
            role="listbox"
            className="absolute z-40 mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-72 overflow-y-auto scrollbar-thin animate-fade-in"
          >
            {items.length === 0 ? (
              <div className="px-4 py-4 text-sm text-gray-500 text-center">
                {isFetching ? 'Searching…' : emptyText}
              </div>
            ) : (
              items.map((item, i) => (
                <button
                  key={getKey(item)}
                  type="button"
                  role="option"
                  aria-selected={i === highlight}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => pick(item)}
                  className={cn(
                    'w-full text-left px-4 border-b border-gray-50 last:border-0 transition-colors',
                    size === 'lg' ? 'py-3.5' : 'py-2.5',
                    i === highlight ? 'bg-primary-50' : 'hover:bg-gray-50'
                  )}
                >
                  {renderItem(item)}
                </button>
              ))
            )}
            {footer && (
              <div className="border-t border-gray-100 bg-gray-50/60">
                {footer(query, () => setOpen(false))}
              </div>
            )}
          </div>
        )}
      </div>

      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-sm text-gray-500">{hint}</p>}
      {value && <span className="sr-only">{getLabel(value)} selected</span>}
    </div>
  );
}
