import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'received' | 'given';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500 shadow-sm hover:shadow',
  secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 focus-visible:ring-gray-400',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 shadow-sm',
  ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-400',
  outline:
    'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus-visible:ring-primary-500 shadow-sm',
  received:
    'bg-received-600 text-white hover:bg-received-700 focus-visible:ring-received-500 shadow-sm',
  given: 'bg-given-600 text-white hover:bg-given-700 focus-visible:ring-given-500 shadow-sm',
};

const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-sm min-h-[36px]',
  md: 'px-4 py-2.5 text-sm min-h-[42px]',
  lg: 'px-6 py-3 text-base min-h-[48px]',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading,
      disabled,
      icon,
      fullWidth,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : icon ? (
        <span className="shrink-0 inline-flex" aria-hidden>
          {icon}
        </span>
      ) : null}
      {children}
    </button>
  )
);

Button.displayName = 'Button';

/** Square icon-only button for table row actions. */
export const IconButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; tone?: 'default' | 'danger' | 'primary' }
>(({ className, label, tone = 'default', type = 'button', children, ...props }, ref) => (
  <button
    ref={ref}
    type={type}
    aria-label={label}
    title={label}
    className={cn(
      'inline-flex items-center justify-center h-9 w-9 rounded-lg transition-colors text-gray-400',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
      tone === 'default' && 'hover:text-gray-800 hover:bg-gray-100',
      tone === 'primary' && 'hover:text-primary-700 hover:bg-primary-50',
      tone === 'danger' && 'hover:text-red-600 hover:bg-red-50',
      className
    )}
    {...props}
  >
    {children}
  </button>
));

IconButton.displayName = 'IconButton';
