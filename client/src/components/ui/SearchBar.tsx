import React, { useRef, useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  debounceMs?: number;
  id?: string;
  size?: 'md' | 'lg';
}

/** Debounced search input. `value` is the committed (debounced) value. */
export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search…',
  className,
  autoFocus,
  debounceMs = 300,
  id,
  size = 'md',
}) => {
  const [local, setLocal] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setLocal(v);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(v), debounceMs);
  };

  const clear = () => {
    clearTimeout(timerRef.current);
    setLocal('');
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <div className={cn('relative', className)}>
      <Search
        className={cn(
          'absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none',
          size === 'lg' ? 'left-4 h-5 w-5' : 'left-3 h-4 w-4'
        )}
        aria-hidden
      />
      <input
        id={id}
        ref={inputRef}
        type="search"
        value={local}
        onChange={handleChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        enterKeyHint="search"
        className={cn(
          'w-full rounded-xl border border-gray-300 bg-white text-gray-900',
          'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
          'placeholder-gray-400 transition-colors [&::-webkit-search-cancel-button]:hidden',
          size === 'lg'
            ? 'pl-12 pr-11 py-3.5 text-lg min-h-[56px]'
            : 'pl-9 pr-9 py-2.5 text-base sm:text-sm min-h-[44px]'
        )}
        aria-label={placeholder}
      />
      {local && (
        <button
          type="button"
          onClick={clear}
          className={cn(
            'absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-md',
            size === 'lg' ? 'right-3' : 'right-2'
          )}
          aria-label="Clear search"
        >
          <X className={size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />
        </button>
      )}
    </div>
  );
};
