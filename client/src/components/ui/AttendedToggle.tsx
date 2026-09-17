import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttendedToggleProps {
  attended: boolean;
  onToggle: () => void;
  pending?: boolean;
  size?: 'md' | 'lg';
  label?: string;
  className?: string;
}

/**
 * Big, thumb-friendly checkbox used on the Our-Function people list.
 * Ticked = attended → the row is struck through by its parent.
 */
export const AttendedToggle: React.FC<AttendedToggleProps> = ({
  attended,
  onToggle,
  pending,
  size = 'lg',
  label,
  className,
}) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={attended}
    aria-label={label || (attended ? 'Checked (Permanent)' : 'Check row')}
    disabled={attended || pending}
    onClick={(e) => {
      e.stopPropagation();
      if (!attended && !pending) {
        onToggle();
      }
    }}
    className={cn(
      'inline-flex items-center justify-center rounded-lg border-2 transition-all shrink-0',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-received-500',
      size === 'lg' ? 'h-11 w-11' : 'h-8 w-8',
      attended
        ? 'bg-received-600 border-received-600 text-white cursor-default opacity-90'
        : 'bg-white border-gray-300 text-transparent hover:border-received-400 cursor-pointer',
      pending && 'opacity-60',
      className
    )}
  >
    <Check className={size === 'lg' ? 'h-6 w-6' : 'h-4 w-4'} strokeWidth={3} aria-hidden />
  </button>
);
