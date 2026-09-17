import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
  compact,
}) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center text-center px-6',
      compact ? 'py-8' : 'py-16',
      className
    )}
  >
    {icon && (
      <div
        className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 text-gray-400"
        aria-hidden
      >
        {icon}
      </div>
    )}
    <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
    {description && <p className="text-sm text-gray-500 mb-6 max-w-xs">{description}</p>}
    {action && <div>{action}</div>}
  </div>
);

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'We could not load this right now.',
  onRetry,
  className,
  compact,
}) => (
  <div
    role="alert"
    className={cn(
      'flex flex-col items-center justify-center text-center px-6',
      compact ? 'py-8' : 'py-16',
      className
    )}
  >
    <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4" aria-hidden>
      <AlertTriangle className="h-7 w-7 text-red-500" />
    </div>
    <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
    <p className="text-sm text-gray-500 mb-6 max-w-xs">{message}</p>
    {onRetry && (
      <Button onClick={onRetry} icon={<RefreshCw className="h-4 w-4" />}>
        Try Again
      </Button>
    )}
  </div>
);
